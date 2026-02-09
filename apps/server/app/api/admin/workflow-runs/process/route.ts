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
 * POST /api/admin/workflow-runs/process
 */
export async function POST(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) return unauthorized('Missing access token');

    const user = getUserFromToken(accessToken);
    if (!user) return unauthorized('Invalid access token');

    const body = await request.json();
    const { workflow_id, trigger_entity_type, trigger_entity_id, tenant_slug } = body;

    if (!workflow_id || !trigger_entity_type || !trigger_entity_id) {
      return badRequest('workflow_id, trigger_entity_type, and trigger_entity_id are required');
    }

    const tenantSlug = tenant_slug || request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) return badRequest('Tenant not found');

    // Create workflow run
    const { data, error } = await supabase
      .from('workflow_runs')
      .insert({
        tenant_id: tenant.id,
        workflow_id,
        trigger_entity_type,
        trigger_entity_id,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return serverError('Failed to process workflow', error);

    return success(data);
  } catch (error) {
    return serverError('Failed to process workflow', error);
  }
}
