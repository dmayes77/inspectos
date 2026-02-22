import { badRequest, serverError, success } from '@/lib/supabase';
import { requirePermission, withAuth } from '@/lib/api/with-auth';
import type { SupabaseClient } from '@supabase/supabase-js';
import { syncStripeSeatQuantityForTenant } from '@/lib/billing/stripe-seat-sync';
import { validatePasswordPolicy } from '@/lib/security/password-policy';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NEUTRAL_MEMBER_COLOR = '#CBD5E1';

function defaultProfileColorForDbRole(role: string | null | undefined) {
  switch ((role ?? '').toLowerCase()) {
    case 'owner':
      return '#94A3B8';
    case 'admin':
      return '#60A5FA';
    case 'inspector':
      return '#2DD4BF';
    case 'viewer':
    case 'member':
      return '#C4B5FD';
    default:
      return '#CBD5E1';
  }
}

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

function mapRole(role: string | null | undefined) {
  switch ((role ?? '').toLowerCase()) {
    case 'owner':
      return 'OWNER';
    case 'admin':
      return 'ADMIN';
    case 'inspector':
      return 'INSPECTOR';
    case 'viewer':
    case 'member':
      return 'OFFICE_STAFF';
    default:
      return 'OFFICE_STAFF';
  }
}

function formatJoinedDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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

/**
 * GET /api/admin/team
 */
export const GET = withAuth(async ({ serviceClient, tenant, memberRole, memberPermissions }) => {
  const permissionCheck = requirePermission(
    memberRole,
    'view_team',
    'You do not have permission to view team members',
    memberPermissions
  );
  if (permissionCheck) return permissionCheck;

  const { data, error } = await serviceClient
    .from('tenant_members')
    .select('user_id, role, created_at, profiles(id, member_id, full_name, email, avatar_url, phone, address_line1, address_line2, city, state_region, postal_code, country, profile_color, custom_permissions, weekly_availability, availability_exceptions, is_inspector)')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: true });

  if (error) {
    return serverError('Failed to fetch team members', error);
  }

  const members = (data ?? []).map((row: Record<string, unknown>) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const location = [profile?.city, profile?.state_region].filter(Boolean).join(', ');
    return {
      id: profile?.id ?? row.user_id,
      memberId: profile?.member_id ?? '',
      teamMemberId: profile?.id ?? row.user_id,
      avatarUrl: profile?.avatar_url ?? undefined,
      name: profile?.full_name ?? profile?.email ?? 'Unknown',
      email: profile?.email ?? '',
      phone: profile?.phone ?? '',
      isInspector: Boolean(profile?.is_inspector) || mapRole(row.role as string | null | undefined) === 'INSPECTOR',
      role: mapRole(row.role as string | null | undefined),
      status: 'active',
      location,
      addressLine1: profile?.address_line1 ?? '',
      addressLine2: profile?.address_line2 ?? '',
      city: profile?.city ?? '',
      stateRegion: profile?.state_region ?? '',
      postalCode: profile?.postal_code ?? '',
      country: profile?.country ?? '',
      color: profile?.profile_color ?? defaultProfileColorForDbRole(row.role as string | null | undefined),
      inspections: 0,
      rating: null,
      certifications: [],
      joinedDate: formatJoinedDate(row.created_at as string | null | undefined),
      customPermissions: Array.isArray(profile?.custom_permissions) ? profile.custom_permissions : [],
      weeklyAvailability: Array.isArray(profile?.weekly_availability)
        ? profile.weekly_availability
        : [],
      availabilityExceptions: Array.isArray(profile?.availability_exceptions)
        ? profile.availability_exceptions
        : [],
    };
  });

  return success(members);
});

/**
 * POST /api/admin/team
 */
export const POST = withAuth(async ({ serviceClient, tenant, memberRole: actorRole, memberPermissions, request }) => {
  const createPermissionCheck = requirePermission(
    actorRole,
    'create_team',
    'You do not have permission to add team members',
    memberPermissions
  );
  if (createPermissionCheck) return createPermissionCheck;

  const body = await request.json();
  const {
    email: rawEmail,
    name,
    role: rawRole,
    password: rawPassword,
    phone,
    send_login_details,
    address_line1,
    address_line2,
    city,
    state_region,
    postal_code,
    country,
    is_inspector,
  } = body;

  const email = rawEmail?.trim().toLowerCase();
  const password = typeof rawPassword === 'string' ? rawPassword.trim() : '';
  const wantsLoginEmail = Boolean(send_login_details);
  const nextMemberRole = mapRoleToDb(typeof rawRole === 'string' ? rawRole.trim() : null);
  const requestedInspectorFlag = Boolean(is_inspector);

  if (!email) {
    return badRequest('Email is required');
  }
  if (!EMAIL_REGEX.test(email)) {
    return badRequest('Invalid email format');
  }

  if (!rawRole || !nextMemberRole) {
    return badRequest('Role is required before sending an invite');
  }

  if (actorRole !== 'owner' && actorRole !== 'admin') {
    return badRequest('Only owner or admin can assign roles');
  }

  const isRoleAllowedForActor =
    actorRole === 'owner'
      ? ['owner', 'admin', 'inspector', 'viewer'].includes(nextMemberRole)
      : ['admin', 'inspector', 'viewer'].includes(nextMemberRole);

  if (!isRoleAllowedForActor) {
    return badRequest('You cannot assign this role');
  }

  const effectiveInspectorSeat =
    nextMemberRole === 'inspector' ||
    ((nextMemberRole === 'owner' || nextMemberRole === 'admin') && requestedInspectorFlag);

  if (
    requestedInspectorFlag &&
    nextMemberRole !== 'inspector' &&
    nextMemberRole !== 'owner' &&
    nextMemberRole !== 'admin'
  ) {
    return badRequest('Only owners, admins, or inspectors can hold inspector seats');
  }

  if (
    effectiveInspectorSeat &&
    !hasRequiredInspectorAddress({
      address_line1: typeof address_line1 === 'string' ? address_line1 : null,
      city: typeof city === 'string' ? city : null,
      state_region: typeof state_region === 'string' ? state_region : null,
      postal_code: typeof postal_code === 'string' ? postal_code : null,
    })
  ) {
    return badRequest('Address line 1, city, state, and postal code are required for inspectors');
  }

  const { data: usersResult, error: userError } = await serviceClient.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (userError) {
    return serverError('Failed to query auth users', userError);
  }

  const foundUser = usersResult?.users?.find((candidate) => candidate.email?.toLowerCase() === email);
  let userId = foundUser?.id ?? null;

  if (!userId) {
    if (!password) {
      return badRequest('Password is required when creating a new user.');
    }
    const passwordError = validatePasswordPolicy(password);
    if (passwordError) {
      return badRequest(passwordError);
    }

    const { data: createdAuthUser, error: createAuthUserError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createAuthUserError || !createdAuthUser?.user?.id) {
      return serverError('Failed to create auth user', createAuthUserError);
    }

    userId = createdAuthUser.user.id;
  } else if (password) {
    const passwordError = validatePasswordPolicy(password);
    if (passwordError) {
      return badRequest(passwordError);
    }
    const { error: resetPasswordError } = await serviceClient.auth.admin.updateUserById(userId, { password });
    if (resetPasswordError) {
      return serverError('Failed to set member password', resetPasswordError);
    }
  }

  const { data: existingProfile } = await serviceClient
    .from('profiles')
    .select('is_inspector, profile_color')
    .eq('id', userId)
    .maybeSingle();
  const wasInspectorSeat = Boolean(existingProfile?.is_inspector);
  const defaultRoleColor = defaultProfileColorForDbRole(nextMemberRole);
  const existingProfileColor =
    typeof existingProfile?.profile_color === 'string'
      ? existingProfile.profile_color.trim().toUpperCase()
      : null;
  const shouldApplyDefaultColor =
    !existingProfileColor || existingProfileColor === NEUTRAL_MEMBER_COLOR;

  if (effectiveInspectorSeat && !wasInspectorSeat) {
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

  if (
    name ||
    phone ||
    address_line1 ||
    address_line2 ||
    city ||
    state_region ||
    postal_code ||
    country ||
    effectiveInspectorSeat ||
    shouldApplyDefaultColor
  ) {
    await serviceClient
      .from('profiles')
      .upsert(
        {
          id: userId,
          email,
          full_name: name,
          phone: phone ?? null,
          address_line1: address_line1 ?? null,
          address_line2: address_line2 ?? null,
          city: city ?? null,
          state_region: state_region ?? null,
          postal_code: postal_code ?? null,
          country: country ?? null,
          is_inspector: effectiveInspectorSeat,
          profile_color: shouldApplyDefaultColor ? defaultRoleColor : undefined,
        },
        { onConflict: 'id' }
      );
  }

  const rolePermissionCheck = requirePermission(
    actorRole,
    'manage_roles',
    'You do not have permission to manage member roles',
    memberPermissions
  );
  if (rolePermissionCheck) return rolePermissionCheck;

  if (nextMemberRole === 'owner' && actorRole !== 'owner') {
    return badRequest('Only owners can assign owner role');
  }

  const { data: existingMembership, error: existingMembershipError } = await serviceClient
    .from('tenant_members')
    .select('tenant_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingMembershipError) {
    return serverError('Failed to verify existing membership', existingMembershipError);
  }

  if (existingMembership && existingMembership.tenant_id !== tenant.id) {
    return badRequest('User already belongs to another business');
  }

  const { error: memberError } = await serviceClient
    .from('tenant_members')
    .upsert({ tenant_id: tenant.id, user_id: userId, role: nextMemberRole }, { onConflict: 'tenant_id,user_id' });

  if (memberError) {
    return serverError('Failed to create team member', memberError);
  }

  const { data: profileAfterUpsert, error: profileAfterUpsertError } = await serviceClient
    .from('profiles')
    .select('member_id')
    .eq('id', userId)
    .maybeSingle();

  if (profileAfterUpsertError) {
    return serverError('Failed to resolve member id', profileAfterUpsertError);
  }

  const seatSync = await syncStripeSeatQuantityForTenant(serviceClient, tenant.id);

  return success({
    user_id: userId,
    member_id: profileAfterUpsert?.member_id ?? null,
    login_email_requested: wantsLoginEmail,
    billingSeatSync: seatSync,
  });
});
