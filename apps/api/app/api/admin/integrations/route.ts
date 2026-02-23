import { serverError, success } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';
import { validateRequestBody } from '@/lib/api/validate';
import { createIntegrationSchema } from '@inspectos/shared/validations/integration';

/**
 * GET /api/admin/integrations
 */
export const GET = withAuth(async ({ supabase, tenant }) => {
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('type');

  if (error) {
    return serverError('Failed to fetch integrations', error);
  }

  return success(data ?? []);
});

/**
 * POST /api/admin/integrations
 * Create or update integration (upsert)
 */
export const POST = withAuth(async ({ supabase, tenant, request }) => {
  const validation = await validateRequestBody(request, createIntegrationSchema);
  if (validation.error) {
    return validation.error;
  }
  const { type, provider, config } = validation.data;

  // Check if integration already exists for this type
  const { data: existing } = await supabase
    .from('integrations')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('type', type)
    .maybeSingle();

  if (existing) {
    // Update existing integration
    const { data, error } = await supabase
      .from('integrations')
      .update({
        provider,
        config: config || {},
        status: 'connected',
        connected_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error || !data) {
      return serverError(error?.message ?? 'Failed to update integration.', error);
    }

    return success(data);
  }

  // Create new integration
  const { data, error } = await supabase
    .from('integrations')
    .insert({
      tenant_id: tenant.id,
      type,
      provider,
      config: config || {},
      status: 'connected',
      connected_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    return serverError(error?.message ?? 'Failed to create integration.', error);
  }

  return success(data);
});
