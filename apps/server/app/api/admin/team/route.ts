import { NextRequest } from 'next/server';
import {
  createUserClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  badRequest,
  serverError,
  success
} from '@/lib/supabase';
import { resolveTenant } from '@/lib/tenants';

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
export async function GET(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return unauthorized('Missing access token');
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return unauthorized('Invalid access token');
    }

    const tenantSlug = request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    const { data, error } = await supabase
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
  } catch (error) {
    return serverError('Failed to fetch team members', error);
  }
}

/**
 * POST /api/admin/team
 */
export async function POST(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return unauthorized('Missing access token');
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return unauthorized('Invalid access token');
    }

    const body = await request.json();
    const { email: rawEmail, name, role: rawRole, phone, tenant_slug } = body;

    const email = rawEmail?.trim().toLowerCase();
    const role = rawRole?.toLowerCase();

    if (!email) {
      return badRequest('Email is required');
    }

    const tenantSlug = tenant_slug || request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    // Note: This requires admin access to list users
    // In production, you might need to use a service role client here
    const { data: usersResult, error: userError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });

    const foundUser = usersResult?.users?.find((candidate) => candidate.email?.toLowerCase() === email);
    if (userError || !foundUser) {
      return badRequest('Auth user not found. Create the user in Supabase Auth first.');
    }

    const userId = foundUser.id;

    if (name || phone) {
      await supabase
        .from('profiles')
        .upsert(
          { id: userId, email, full_name: name, phone: phone ?? null },
          { onConflict: 'id' }
        );
    }

    const memberRole = ['owner', 'admin', 'inspector', 'viewer'].includes(role ?? '') ? role : 'viewer';

    const { error: memberError } = await supabase
      .from('tenant_members')
      .upsert({ tenant_id: tenant.id, user_id: userId, role: memberRole }, { onConflict: 'tenant_id,user_id' });

    if (memberError) {
      return serverError('Failed to create team member', memberError);
    }

    return success({ user_id: userId });
  } catch (error) {
    return serverError('Failed to create team member', error);
  }
}
