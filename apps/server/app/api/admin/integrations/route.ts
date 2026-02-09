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
import { validateRequestBody } from '@/lib/api/validate';
import { createIntegrationSchema } from '@inspectos/shared/validations/integration';

/**
 * GET /api/admin/integrations
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
      .from('integrations')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('type');

    if (error) {
      return serverError('Failed to fetch integrations', error);
    }

    return success(data ?? []);
  } catch (error) {
    return serverError('Failed to fetch integrations', error);
  }
}

/**
 * POST /api/admin/integrations
 * Create or update integration (upsert)
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

    const validation = await validateRequestBody(request, createIntegrationSchema);
    if (validation.error) {
      return validation.error;
    }
    const { type, provider, config } = validation.data;

    const tenantSlug = (request as NextRequest).nextUrl?.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

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
  } catch (error) {
    return serverError('Failed to create integration', error);
  }
}
