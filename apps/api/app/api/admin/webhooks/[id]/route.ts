import { serverError, success } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';
import { validateRequestBody } from '@/lib/api/validate';
import { updateWebhookSchema } from '@inspectos/shared/validations/webhook';

/**
 * GET /api/admin/webhooks/[id]
 * Get webhook details with recent deliveries
 */
export const GET = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const { id } = params;

  const { data: webhook, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('id', id)
    .single();

  if (error || !webhook) {
    return serverError(error?.message ?? 'Webhook not found.', error);
  }

  // Fetch recent deliveries
  const { data: deliveries } = await supabase
    .from('webhook_deliveries')
    .select('*')
    .eq('webhook_id', id)
    .order('delivered_at', { ascending: false })
    .limit(50);

  return success({
    ...webhook,
    recent_deliveries: deliveries ?? [],
  });
});

/**
 * PUT /api/admin/webhooks/[id]
 * Update webhook configuration
 */
export const PUT = withAuth<{ id: string }>(async ({ supabase, tenant, params, request }) => {
  const { id } = params;

  const validation = await validateRequestBody(request, updateWebhookSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

  // Build update object
  const updateData: Record<string, unknown> = {};
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.url !== undefined) updateData.url = payload.url;
  if (payload.description !== undefined) updateData.description = payload.description;
  if (payload.events !== undefined) updateData.events = payload.events;
  if (payload.secret !== undefined) updateData.secret = payload.secret;
  if (payload.headers !== undefined) updateData.headers = payload.headers;
  if (payload.status !== undefined) {
    updateData.status = payload.status;
    // Reset failure count if manually activated
    if (payload.status === 'active') {
      updateData.failure_count = 0;
      updateData.last_error = null;
    }
  }
  if (payload.retry_strategy !== undefined) {
    updateData.retry_strategy = payload.retry_strategy;
  }

  const { data, error } = await supabase
    .from('webhooks')
    .update(updateData)
    .eq('tenant_id', tenant.id)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return serverError(error?.message ?? 'Failed to update webhook.', error);
  }

  return success(data);
});

/**
 * DELETE /api/admin/webhooks/[id]
 * Delete webhook
 */
export const DELETE = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const { id } = params;

  const { error } = await supabase
    .from('webhooks')
    .delete()
    .eq('tenant_id', tenant.id)
    .eq('id', id);

  if (error) {
    return serverError(error.message ?? 'Failed to delete webhook.', error);
  }

  return success(true);
});
