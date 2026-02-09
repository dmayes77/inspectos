import { NextRequest } from 'next/server';
import {
  createUserClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  badRequest,
  notFound,
  serverError,
  success
} from '@/lib/supabase';
import { resolveTenant } from '@/lib/tenants';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/workflows/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

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
      .eq('id', id)
      .single();

    if (error) return notFound('Workflow not found');

    return success(data);
  } catch (error) {
    return serverError('Failed to fetch workflow', error);
  }
}

/**
 * PUT /api/admin/workflows/[id]
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) return unauthorized('Missing access token');

    const user = getUserFromToken(accessToken);
    if (!user) return unauthorized('Invalid access token');

    const body = await request.json();
    const { tenant_slug } = body;

    const tenantSlug = tenant_slug || request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) return badRequest('Tenant not found');

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.trigger_event !== undefined) updateData.trigger_event = body.trigger_event;
    if (body.actions !== undefined) updateData.actions = body.actions;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    const { data, error } = await supabase
      .from('workflows')
      .update(updateData)
      .eq('tenant_id', tenant.id)
      .eq('id', id)
      .select()
      .single();

    if (error) return serverError('Failed to update workflow', error);

    return success(data);
  } catch (error) {
    return serverError('Failed to update workflow', error);
  }
}

/**
 * DELETE /api/admin/workflows/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) return unauthorized('Missing access token');

    const user = getUserFromToken(accessToken);
    if (!user) return unauthorized('Invalid access token');

    const tenantSlug = request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) return badRequest('Tenant not found');

    const { error } = await supabase
      .from('workflows')
      .update({ is_active: false })
      .eq('tenant_id', tenant.id)
      .eq('id', id);

    if (error) return serverError('Failed to delete workflow', error);

    return success({ success: true });
  } catch (error) {
    return serverError('Failed to delete workflow', error);
  }
}
