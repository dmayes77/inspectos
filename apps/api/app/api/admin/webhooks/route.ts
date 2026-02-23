import { randomBytes } from 'crypto';
import { serverError, success } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';
import { validateRequestBody } from '@/lib/api/validate';
import { createWebhookSchema } from '@inspectos/shared/validations/webhook';

/**
 * GET /api/admin/webhooks
 * List all webhooks for the current tenant
 */
export const GET = withAuth(async ({ supabase, tenant }) => {
  const { data, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false });

  if (error) {
    return serverError('Failed to fetch webhooks', error);
  }

  return success(data ?? []);
});

/**
 * POST /api/admin/webhooks
 * Create a new webhook
 */
export const POST = withAuth(async ({ supabase, tenant, request }) => {
  const validation = await validateRequestBody(request, createWebhookSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

  // Generate secret if not provided
  const secret = payload.secret || randomBytes(32).toString('hex');

  const { data, error } = await supabase
    .from('webhooks')
    .insert({
      tenant_id: tenant.id,
      name: payload.name,
      url: payload.url,
      description: payload.description ?? null,
      events: payload.events,
      secret,
      headers: payload.headers ?? {},
      retry_strategy: payload.retry_strategy ?? {
        max_attempts: 3,
        backoff: 'exponential',
        timeout: 30000,
      },
      status: 'active',
    })
    .select()
    .single();

  if (error || !data) {
    return serverError(error?.message ?? 'Failed to create webhook.', error);
  }

  return success(data);
});
