import { badRequest, serverError, success } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';
import { validateRequestBody } from '@/lib/api/validate';
import { updateIntegrationSchema } from '@inspectos/shared/validations/integration';

/**
 * GET /api/admin/integrations/[id]
 */
export const GET = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const { id } = params;

  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenant.id)
    .single();

  if (error || !data) {
    return serverError(error?.message ?? 'Integration not found.', error);
  }

  return success(data);
});

/**
 * PUT /api/admin/integrations/[id]
 */
export const PUT = withAuth<{ id: string }>(async ({ supabase, tenant, params, request }) => {
  const { id } = params;

  const validation = await validateRequestBody(request, updateIntegrationSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

  const updates: Record<string, unknown> = {};
  if (payload.config !== undefined) updates.config = payload.config;
  if (payload.status !== undefined) updates.status = payload.status;

  if (Object.keys(updates).length === 0) {
    return badRequest('No updates provided');
  }

  const { data, error } = await supabase
    .from('integrations')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', tenant.id)
    .select()
    .single();

  if (error || !data) {
    return serverError(error?.message ?? 'Failed to update integration.', error);
  }

  return success(data);
});

/**
 * DELETE /api/admin/integrations/[id]
 * Soft delete by disconnecting the integration
 */
export const DELETE = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const { id } = params;

  // Soft delete by setting status to disconnected and clearing config
  const { error } = await supabase
    .from('integrations')
    .update({
      status: 'disconnected',
      connected_at: null,
      config: {},
    })
    .eq('id', id)
    .eq('tenant_id', tenant.id);

  if (error) {
    return serverError(error.message ?? 'Failed to disconnect integration.', error);
  }

  return success(true);
});
