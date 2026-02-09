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
 * GET /api/admin/workflow-runs
 */
export async function GET(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) return unauthorized('Missing access token');

    const user = getUserFromToken(accessToken);
    if (!user) return unauthorized('Invalid access token');

    const tenantSlug = request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) return badRequest('Tenant not found');

    const { data, error } = await supabase
      .from('workflow_runs')
      .select('*, workflow:workflows(id, name), trigger_entity:trigger_entity_type')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    if (error) return serverError('Failed to fetch workflow runs', error);

    return success(data || []);
  } catch (error) {
    return serverError('Failed to fetch workflow runs', error);
  }
}
