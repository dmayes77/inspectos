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
 * GET /api/admin/workflows
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
      .from('workflows')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('name');

    if (error) return serverError('Failed to fetch workflows', error);

    return success(data || []);
  } catch (error) {
    return serverError('Failed to fetch workflows', error);
  }
}

/**
 * POST /api/admin/workflows
 */
export async function POST(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) return unauthorized('Missing access token');

    const user = getUserFromToken(accessToken);
    if (!user) return unauthorized('Invalid access token');

    const body = await request.json();
    const { name, description, trigger_event, actions, tenant_slug } = body;

    if (!name || !trigger_event) {
      return badRequest('name and trigger_event are required');
    }

    const tenantSlug = tenant_slug || request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) return badRequest('Tenant not found');

    const { data, error } = await supabase
      .from('workflows')
      .insert({
        tenant_id: tenant.id,
        name,
        description,
        trigger_event,
        actions: actions || [],
        is_active: true,
      })
      .select()
      .single();

    if (error) return serverError('Failed to create workflow', error);

    return success(data);
  } catch (error) {
    return serverError('Failed to create workflow', error);
  }
}
