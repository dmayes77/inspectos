import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
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
import { validateRequestBody } from '@/lib/api/validate';
import { createWebhookSchema } from '@/lib/validations/webhook';

/**
 * GET /api/admin/webhooks
 * List all webhooks for the current tenant
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

    const { data, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    if (error) {
      return serverError('Failed to fetch webhooks', error);
    }

    return success(data ?? []);
  } catch (error) {
    return serverError('Failed to fetch webhooks', error);
  }
}

/**
 * POST /api/admin/webhooks
 * Create a new webhook
 */
export async function POST(request: Request) {
  try {
    const accessToken = getAccessToken(request as NextRequest);
    if (!accessToken) {
      return unauthorized('Missing access token');
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return unauthorized('Invalid access token');
    }

    const validation = await validateRequestBody(request, createWebhookSchema);
    if (validation.error) {
      return validation.error;
    }
    const payload = validation.data;

    const tenantSlug = (request as NextRequest).nextUrl?.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

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
  } catch (error) {
    return serverError('Failed to create webhook', error);
  }
}
