import { notFound, serverError, success } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';
import { parseRouteIdentifier } from '@/lib/identifiers/lookup';

/**
 * GET /api/admin/workflows/[id]
 */
export const GET = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const workflowId = parseRouteIdentifier(params.id);

  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('id', workflowId)
    .single();

  if (error) return notFound('Workflow not found');

  return success(data);
});

/**
 * PUT /api/admin/workflows/[id]
 */
export const PUT = withAuth<{ id: string }>(async ({ supabase, tenant, params, request }) => {
  const workflowId = parseRouteIdentifier(params.id);

  const body = await request.json();

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
    .eq('id', workflowId)
    .select()
    .single();

  if (error) return serverError('Failed to update workflow', error);

  return success(data);
});

/**
 * DELETE /api/admin/workflows/[id]
 */
export const DELETE = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const workflowId = parseRouteIdentifier(params.id);

  const { error } = await supabase
    .from('workflows')
    .update({ is_active: false })
    .eq('tenant_id', tenant.id)
    .eq('id', workflowId);

  if (error) return serverError('Failed to delete workflow', error);

  return success({ success: true });
});
