import { badRequest, serverError, success } from '@/lib/supabase';
import { requirePermission, withAuth } from '@/lib/api/with-auth';

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

/**
 * PUT /api/admin/team/[id]
 */
export const PUT = withAuth<{ id: string }>(async ({ serviceClient, tenant, memberRole: actorRole, params, request }) => {
  const editPermissionCheck = requirePermission(actorRole, 'edit_team', 'You do not have permission to edit team members');
  if (editPermissionCheck) return editPermissionCheck;

  const { id } = params;

  const memberId = id?.trim?.() ?? '';
  const isValidId = /^[0-9a-fA-F-]{36}$/.test(memberId);
  if (!isValidId) {
    return badRequest('Invalid team member id');
  }

  const body = await request.json();
  const { name, avatarUrl, role: rawRole, email: rawEmail, phone } = body;

  const fullName = typeof name === 'string' ? name.trim() : undefined;
  const avatar = typeof avatarUrl === 'string' ? avatarUrl : undefined;
  const role = mapRoleToDb(rawRole);
  const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : undefined;
  const phoneNumber = typeof phone === 'string' ? phone.trim() : undefined;

  const { data: targetMembership, error: targetMembershipError } = await serviceClient
    .from('tenant_members')
    .select('role')
    .eq('tenant_id', tenant.id)
    .eq('user_id', memberId)
    .maybeSingle();

  if (targetMembershipError || !targetMembership) {
    return badRequest('Team member not found');
  }

  const targetRole = (targetMembership as { role?: string }).role?.toLowerCase();
  if (actorRole !== 'owner' && targetRole === 'owner') {
    return badRequest('Only owners can modify owner members');
  }

  if (role === 'owner' && actorRole !== 'owner') {
    return badRequest('Only owners can assign owner role');
  }

  if (role) {
    const rolePermissionCheck = requirePermission(actorRole, 'manage_roles', 'You do not have permission to manage member roles');
    if (rolePermissionCheck) return rolePermissionCheck;
  }

  const profileUpdate: Record<string, string> = {};
  if (fullName) profileUpdate.full_name = fullName;
  if (avatar) profileUpdate.avatar_url = avatar;
  if (email) profileUpdate.email = email;
  if (phoneNumber) profileUpdate.phone = phoneNumber;

  if (Object.keys(profileUpdate).length > 0) {
    const { error: profileError } = await serviceClient
      .from('profiles')
      .update(profileUpdate)
      .eq('id', memberId);

    if (profileError) {
      return serverError('Failed to update profile', profileError);
    }
  }

  if (role) {
    const { error: memberError } = await serviceClient
      .from('tenant_members')
      .update({ role })
      .eq('tenant_id', tenant.id)
      .eq('user_id', memberId);

    if (memberError) {
      return serverError('Failed to update team member role', memberError);
    }
  }

  return success({ success: true });
});

/**
 * DELETE /api/admin/team/[id]
 */
export const DELETE = withAuth<{ id: string }>(async ({ serviceClient, tenant, memberRole: actorRole, params }) => {
  const deletePermissionCheck = requirePermission(actorRole, 'delete_team', 'You do not have permission to remove team members');
  if (deletePermissionCheck) return deletePermissionCheck;

  const { id } = params;

  const memberId = id?.trim?.() ?? '';
  const isValidId = /^[0-9a-fA-F-]{36}$/.test(memberId);
  if (!isValidId) {
    return badRequest('Invalid team member id');
  }

  const { data: targetMembership, error: targetMembershipError } = await serviceClient
    .from('tenant_members')
    .select('role')
    .eq('tenant_id', tenant.id)
    .eq('user_id', memberId)
    .maybeSingle();

  if (targetMembershipError || !targetMembership) {
    return badRequest('Team member not found');
  }

  const targetRole = (targetMembership as { role?: string }).role?.toLowerCase();
  if (actorRole !== 'owner' && targetRole === 'owner') {
    return badRequest('Only owners can remove owner members');
  }

  const { error } = await serviceClient
    .from('tenant_members')
    .delete()
    .eq('tenant_id', tenant.id)
    .eq('user_id', memberId);

  if (error) {
    return serverError('Failed to delete team member', error);
  }

  return success({ success: true });
});
