import { badRequest, serverError, success } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';

function mapRole(role: string | null | undefined) {
  switch ((role ?? '').toLowerCase()) {
    case 'owner':
      return 'OWNER';
    case 'admin':
      return 'ADMIN';
    case 'inspector':
      return 'INSPECTOR';
    case 'viewer':
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

/**
 * GET /api/admin/team
 */
export const GET = withAuth(async ({ serviceClient, tenant }) => {
  const { data, error } = await serviceClient
    .from('tenant_members')
    .select('user_id, role, created_at, profiles(id, full_name, email, avatar_url, phone)')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: true });

  if (error) {
    return serverError('Failed to fetch team members', error);
  }

  const members = (data ?? []).map((row: Record<string, unknown>) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: profile?.id ?? row.user_id,
      teamMemberId: profile?.id ?? row.user_id,
      avatarUrl: profile?.avatar_url ?? undefined,
      name: profile?.full_name ?? profile?.email ?? 'Unknown',
      email: profile?.email ?? '',
      phone: profile?.phone ?? '',
      role: mapRole(row.role as string | null | undefined),
      status: 'active',
      location: '',
      inspections: 0,
      rating: null,
      certifications: [],
      joinedDate: formatJoinedDate(row.created_at as string | null | undefined),
      customPermissions: [],
    };
  });

  return success(members);
});

/**
 * POST /api/admin/team
 */
export const POST = withAuth(async ({ serviceClient, tenant, request }) => {
  const body = await request.json();
  const { email: rawEmail, name, role: rawRole, phone } = body;

  const email = rawEmail?.trim().toLowerCase();
  const role = rawRole?.toLowerCase();

  if (!email) {
    return badRequest('Email is required');
  }

  const { data: usersResult, error: userError } = await serviceClient.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  const foundUser = usersResult?.users?.find((candidate) => candidate.email?.toLowerCase() === email);
  if (userError || !foundUser) {
    return badRequest('Auth user not found. Create the user in Supabase Auth first.');
  }

  const userId = foundUser.id;

  if (name || phone) {
    await serviceClient
      .from('profiles')
      .upsert(
        { id: userId, email, full_name: name, phone: phone ?? null },
        { onConflict: 'id' }
      );
  }

  const memberRole = ['owner', 'admin', 'inspector', 'viewer'].includes(role ?? '') ? role : 'viewer';

  const { error: memberError } = await serviceClient
    .from('tenant_members')
    .upsert({ tenant_id: tenant.id, user_id: userId, role: memberRole }, { onConflict: 'tenant_id,user_id' });

  if (memberError) {
    return serverError('Failed to create team member', memberError);
  }

  return success({ user_id: userId });
});
