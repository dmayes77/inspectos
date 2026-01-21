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

/**
 * GET /api/admin/inspectors
 *
 * Returns inspectors for a tenant.
 * Query params:
 * - tenant: tenant slug (optional; defaults to user's first tenant)
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

    const { data: members, error: membersError } = await supabase
      .from('tenant_members')
      .select('user_id, role, profile:profiles(id, full_name, email)')
      .eq('tenant_id', tenant.id)
      .in('role', ['owner', 'admin', 'inspector']);

    if (membersError) {
      return serverError('Failed to fetch inspectors', membersError);
    }

    const inspectors = (members || [])
      .map((member) => {
        const profile = member.profile as { id: string; full_name: string | null; email: string } | null;
        if (!profile) return null;
        return {
          teamMemberId: profile.id,
          name: profile.full_name || profile.email
        };
      })
      .filter(Boolean);

    return success(inspectors);
  } catch (error) {
    return serverError('Failed to fetch inspectors', error);
  }
}
