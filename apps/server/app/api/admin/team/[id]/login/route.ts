import { badRequest, serverError, success } from '@/lib/supabase';
import { requirePermission, withAuth } from '@/lib/api/with-auth';
import { validatePasswordPolicy } from '@/lib/security/password-policy';
import { isValidPublicId } from '@/lib/identifiers/public-id';

/**
 * PUT /api/admin/team/[id]/login
 * Reset login credentials for a team member.
 */
export const PUT = withAuth<{ id: string }>(async ({ serviceClient, tenant, memberRole: actorRole, memberPermissions, params, request }) => {
  const permissionCheck = requirePermission(
    actorRole,
    'edit_team',
    'You do not have permission to reset logins',
    memberPermissions
  );
  if (permissionCheck) return permissionCheck;

  const { id } = params;
  const memberId = id?.trim?.().toUpperCase() ?? '';
  if (!isValidPublicId(memberId)) {
    return badRequest('Invalid team member id');
  }

  if (actorRole !== 'owner' && actorRole !== 'admin') {
    return badRequest('Only owner or admin can reset member logins');
  }

  const { data: targetMembership, error: targetMembershipError } = await serviceClient
    .from('tenant_members')
    .select('user_id, role, profiles!inner(member_id)')
    .eq('tenant_id', tenant.id)
    .eq('profiles.member_id', memberId)
    .maybeSingle();

  if (targetMembershipError || !targetMembership) {
    return badRequest('Team member not found');
  }

  const targetRole = (targetMembership as { role?: string }).role?.toLowerCase();
  const targetUserId = (targetMembership as { user_id?: string }).user_id;
  if (!targetUserId) {
    return badRequest('Team member not found');
  }
  if (actorRole !== 'owner' && targetRole === 'owner') {
    return badRequest('Only owners can reset owner logins');
  }

  const body = await request.json() as { password?: string };
  const password = typeof body.password === 'string' ? body.password.trim() : undefined;

  if (!password) {
    return badRequest('Password is required');
  }

  if (password !== undefined) {
    const passwordError = validatePasswordPolicy(password);
    if (passwordError) {
      return badRequest(passwordError);
    }
  }

  if (password) {
    const { error: authPasswordError } = await serviceClient.auth.admin.updateUserById(targetUserId, { password });
    if (authPasswordError) {
      return serverError('Failed to reset password', authPasswordError);
    }
  }

  return success({ success: true });
});
