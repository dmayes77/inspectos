import { badRequest, serverError, success } from '@/lib/supabase';
import { requirePermission, withAuth } from '@/lib/api/with-auth';
import type { SupabaseClient } from '@supabase/supabase-js';
import { syncStripeSeatQuantityForTenant } from '@/lib/billing/stripe-seat-sync';
import { isValidPublicId } from '@/lib/identifiers/public-id';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mapRoleToDb(role: string | null | undefined) {
  switch ((role ?? '').toUpperCase()) {
    case 'OWNER':
      return 'owner';
    case 'ADMIN':
      return 'admin';
    case 'INSPECTOR':
      return 'inspector';
    case 'OFFICE_STAFF':
    case 'MEMBER':
    case 'VIEWER':
      return 'viewer';
    default:
      return null;
  }
}

function hasRequiredInspectorAddress(input: {
  address_line1?: string | null;
  city?: string | null;
  state_region?: string | null;
  postal_code?: string | null;
}) {
  return Boolean(
    input.address_line1?.trim() &&
      input.city?.trim() &&
      input.state_region?.trim() &&
      input.postal_code?.trim()
  );
}

async function countOwners(serviceClient: SupabaseClient, tenantId: string) {
  const { count, error } = await serviceClient
    .from('tenant_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('role', 'owner');

  if (error) {
    return { ownerCount: null as number | null, error };
  }

  return { ownerCount: count ?? 0, error: null };
}

async function countInspectorSeats(serviceClient: SupabaseClient, tenantId: string) {
  const { count, error } = await serviceClient
    .from('tenant_members')
    .select('user_id, profiles!inner(id)', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('profiles.is_inspector', true);
  return { inspectorSeatCount: count ?? 0, error };
}

async function getMaxInspectors(serviceClient: SupabaseClient, tenantId: string) {
  const { data, error } = await serviceClient
    .from('tenants')
    .select('settings')
    .eq('id', tenantId)
    .maybeSingle();
  if (error) return { maxInspectors: null as number | null, error };
  const settings = (data?.settings ?? {}) as { billing?: { maxInspectors?: number } };
  const maxInspectors = Math.max(1, Number(settings.billing?.maxInspectors ?? 5));
  return { maxInspectors, error: null };
}

async function resolveMemberUserId(serviceClient: SupabaseClient, tenantId: string, memberId: string) {
  const { data, error } = await serviceClient
    .from('tenant_members')
    .select('user_id, role, profiles!inner(member_id)')
    .eq('tenant_id', tenantId)
    .eq('profiles.member_id', memberId)
    .maybeSingle();

  if (error) {
    return { userId: null as string | null, role: null as string | null, error };
  }

  if (!data) {
    return { userId: null as string | null, role: null as string | null, error: null };
  }

  return {
    userId: (data as { user_id?: string }).user_id ?? null,
    role: (data as { role?: string }).role ?? null,
    error: null,
  };
}

/**
 * PUT /api/admin/team/[id]
 */
export const PUT = withAuth<{ id: string }>(
  async ({ serviceClient, tenant, memberRole: actorRole, memberPermissions, params, request }) => {
  const editPermissionCheck = requirePermission(
    actorRole,
    'edit_team',
    'You do not have permission to edit team members',
    memberPermissions
  );
  if (editPermissionCheck) return editPermissionCheck;

  const { id } = params;

  const memberId = id?.trim?.().toUpperCase() ?? '';
  if (!isValidPublicId(memberId)) {
    return badRequest('Invalid team member id');
  }

  const body = await request.json();
  const {
    name,
    avatarUrl,
    role: rawRole,
    email: rawEmail,
    phone,
    addressLine1,
    addressLine2,
    city,
    stateRegion,
    postalCode,
    country,
    isInspector,
    customPermissions,
    weeklyAvailability,
    availabilityExceptions,
  } = body;

  const fullName = typeof name === 'string' ? name.trim() : undefined;
  const avatar = typeof avatarUrl === 'string' ? avatarUrl : undefined;
  const role = mapRoleToDb(rawRole);
  const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : undefined;
  const phoneNumber = typeof phone === 'string' ? phone.trim() : undefined;
  const addressLine1Value = typeof addressLine1 === 'string' ? addressLine1.trim() : undefined;
  const addressLine2Value = typeof addressLine2 === 'string' ? addressLine2.trim() : undefined;
  const cityValue = typeof city === 'string' ? city.trim() : undefined;
  const stateRegionValue = typeof stateRegion === 'string' ? stateRegion.trim() : undefined;
  const postalCodeValue = typeof postalCode === 'string' ? postalCode.trim() : undefined;
  const countryValue = typeof country === 'string' ? country.trim() : undefined;
  const isInspectorValue = typeof isInspector === 'boolean' ? isInspector : undefined;
  const customPermissionsValue = Array.isArray(customPermissions)
    ? customPermissions.filter((value: unknown): value is string => typeof value === 'string')
    : undefined;
  const weeklyAvailabilityValue = Array.isArray(weeklyAvailability) ? weeklyAvailability : undefined;
  const availabilityExceptionsValue = Array.isArray(availabilityExceptions) ? availabilityExceptions : undefined;

  const { userId: targetUserId, role: targetRoleRaw, error: targetMembershipError } = await resolveMemberUserId(
    serviceClient,
    tenant.id,
    memberId
  );

  if (targetMembershipError || !targetUserId || !targetRoleRaw) {
    return badRequest('Team member not found');
  }

  const { data: targetProfile, error: targetProfileError } = await serviceClient
    .from('profiles')
    .select('email, address_line1, city, state_region, postal_code, is_inspector')
    .eq('id', targetUserId)
    .maybeSingle();

  if (targetProfileError) {
    return serverError('Failed to fetch target profile', targetProfileError);
  }

  if (email !== undefined) {
    if (!EMAIL_REGEX.test(email)) {
      return badRequest('Invalid email format');
    }

    const { data: duplicateProfile, error: duplicateProfileError } = await serviceClient
      .from('profiles')
      .select('id')
      .ilike('email', email)
      .neq('id', targetUserId)
      .maybeSingle();

    if (duplicateProfileError) {
      return serverError('Failed to validate email uniqueness', duplicateProfileError);
    }

    if (duplicateProfile) {
      return badRequest('Email is already in use');
    }
  }

  const targetRole = targetRoleRaw.toLowerCase();
  const isRoleChanging = Boolean(role && role !== targetRole);
  if (actorRole !== 'owner' && targetRole === 'owner') {
    return badRequest('Only owners can modify owner members');
  }

  if (role === 'owner' && actorRole !== 'owner') {
    return badRequest('Only owners can assign owner role');
  }

  if (role) {
    const isRoleAllowedForActor =
      actorRole === 'owner'
        ? ['owner', 'admin', 'inspector', 'viewer'].includes(role)
        : ['admin', 'inspector', 'viewer'].includes(role);

    if (!isRoleAllowedForActor) {
      return badRequest('You cannot assign this role');
    }
  }

  if (role) {
    if (actorRole !== 'owner' && actorRole !== 'admin') {
      return badRequest('Only owner or admin can change member roles');
    }

    const rolePermissionCheck = requirePermission(
      actorRole,
      'manage_roles',
      'You do not have permission to manage member roles',
      memberPermissions
    );
    if (rolePermissionCheck) return rolePermissionCheck;
  }

  if (targetRole === 'owner' && role && role !== 'owner') {
    const { ownerCount, error: ownerCountError } = await countOwners(serviceClient, tenant.id);
    if (ownerCountError) {
      return serverError('Failed to verify owner count', ownerCountError);
    }

    if ((ownerCount ?? 0) <= 1) {
      return badRequest('At least one owner is required');
    }
  }

  const effectiveRole = role ?? mapRoleToDb(targetRole);
  const currentIsInspector = Boolean(targetProfile?.is_inspector);
  let effectiveIsInspector = currentIsInspector;

  if (effectiveRole === 'inspector') {
    effectiveIsInspector = true;
  } else if (isInspectorValue !== undefined) {
    effectiveIsInspector =
      (effectiveRole === 'owner' || effectiveRole === 'admin') && isInspectorValue;
  } else if (effectiveRole !== 'owner' && effectiveRole !== 'admin') {
    effectiveIsInspector = false;
  }

  if (
    effectiveIsInspector &&
    effectiveRole !== 'owner' &&
    effectiveRole !== 'admin' &&
    effectiveRole !== 'inspector'
  ) {
    return badRequest('Only owners, admins, or inspectors can hold inspector seats');
  }
  const effectiveAddress = {
    address_line1: addressLine1Value ?? targetProfile?.address_line1 ?? null,
    city: cityValue ?? targetProfile?.city ?? null,
    state_region: stateRegionValue ?? targetProfile?.state_region ?? null,
    postal_code: postalCodeValue ?? targetProfile?.postal_code ?? null,
  };

  if (effectiveIsInspector && !hasRequiredInspectorAddress(effectiveAddress)) {
    return badRequest('Address line 1, city, state, and postal code are required for inspectors');
  }

  const isSeatUpgrade = !currentIsInspector && effectiveIsInspector;
  if (isSeatUpgrade) {
    const [{ inspectorSeatCount, error: seatCountError }, { maxInspectors, error: planError }] = await Promise.all([
      countInspectorSeats(serviceClient, tenant.id),
      getMaxInspectors(serviceClient, tenant.id),
    ]);
    if (seatCountError) return serverError('Failed to validate inspector seats', seatCountError);
    if (planError || maxInspectors === null) return serverError('Failed to resolve billing plan limits', planError);
    if (inspectorSeatCount + 1 > maxInspectors) {
      return badRequest(`Inspector seat limit reached for this plan (${maxInspectors} max).`);
    }
  }

  const profileUpdate: Record<string, unknown> = {};
  if (fullName) profileUpdate.full_name = fullName;
  if (avatar) profileUpdate.avatar_url = avatar;
  if (email) profileUpdate.email = email;
  if (phoneNumber) profileUpdate.phone = phoneNumber;
  if (addressLine1Value !== undefined) profileUpdate.address_line1 = addressLine1Value;
  if (addressLine2Value !== undefined) profileUpdate.address_line2 = addressLine2Value;
  if (cityValue !== undefined) profileUpdate.city = cityValue;
  if (stateRegionValue !== undefined) profileUpdate.state_region = stateRegionValue;
  if (postalCodeValue !== undefined) profileUpdate.postal_code = postalCodeValue;
  if (countryValue !== undefined) profileUpdate.country = countryValue;
  if (role || isInspectorValue !== undefined || effectiveIsInspector !== currentIsInspector) {
    profileUpdate.is_inspector = effectiveIsInspector;
  }
  if (customPermissionsValue !== undefined) {
    profileUpdate.custom_permissions = customPermissionsValue;
  } else if (isRoleChanging) {
    profileUpdate.custom_permissions = [];
  }
  if (weeklyAvailabilityValue !== undefined) profileUpdate.weekly_availability = weeklyAvailabilityValue;
  if (availabilityExceptionsValue !== undefined) profileUpdate.availability_exceptions = availabilityExceptionsValue;

  if (Object.keys(profileUpdate).length > 0) {
    if (email && email !== (targetProfile?.email ?? '').toLowerCase()) {
      const { error: authEmailError } = await serviceClient.auth.admin.updateUserById(targetUserId, { email });
      if (authEmailError) {
        return serverError('Failed to update auth email', authEmailError);
      }
    }

    const { error: profileError } = await serviceClient
      .from('profiles')
      .update(profileUpdate)
      .eq('id', targetUserId);

    if (profileError) {
      return serverError('Failed to update profile', profileError);
    }
  }

  if (role) {
    const { error: memberError } = await serviceClient
      .from('tenant_members')
      .update({ role })
      .eq('tenant_id', tenant.id)
      .eq('user_id', targetUserId);

    if (memberError) {
      return serverError('Failed to update team member role', memberError);
    }
  }

  const seatSync = await syncStripeSeatQuantityForTenant(serviceClient, tenant.id);
  return success({ success: true, billingSeatSync: seatSync });
});

/**
 * DELETE /api/admin/team/[id]
 */
export const DELETE = withAuth<{ id: string }>(async ({ serviceClient, tenant, memberRole: actorRole, memberPermissions, params }) => {
  const deletePermissionCheck = requirePermission(
    actorRole,
    'delete_team',
    'You do not have permission to remove team members',
    memberPermissions
  );
  if (deletePermissionCheck) return deletePermissionCheck;

  const { id } = params;

  const memberId = id?.trim?.().toUpperCase() ?? '';
  if (!isValidPublicId(memberId)) {
    return badRequest('Invalid team member id');
  }

  const { userId: targetUserId, role: targetRoleRaw, error: targetMembershipError } = await resolveMemberUserId(
    serviceClient,
    tenant.id,
    memberId
  );

  if (targetMembershipError || !targetUserId || !targetRoleRaw) {
    return badRequest('Team member not found');
  }

  const targetRole = targetRoleRaw.toLowerCase();
  if (actorRole !== 'owner' && targetRole === 'owner') {
    return badRequest('Only owners can remove owner members');
  }

  if (targetRole === 'owner') {
    const { ownerCount, error: ownerCountError } = await countOwners(serviceClient, tenant.id);
    if (ownerCountError) {
      return serverError('Failed to verify owner count', ownerCountError);
    }

    if ((ownerCount ?? 0) <= 1) {
      return badRequest('At least one owner is required');
    }
  }

  const { error } = await serviceClient
    .from('tenant_members')
    .delete()
    .eq('tenant_id', tenant.id)
    .eq('user_id', targetUserId);

  if (error) {
    return serverError('Failed to delete team member', error);
  }

  const seatSync = await syncStripeSeatQuantityForTenant(serviceClient, tenant.id);
  return success({ success: true, billingSeatSync: seatSync });
});
