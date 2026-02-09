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
import { updateIntegrationSchema } from '@inspectos/shared/validations/integration';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/integrations/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

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
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .single();

    if (error || !data) {
      return serverError(error?.message ?? 'Integration not found.', error);
    }

    return success(data);
  } catch (error) {
    return serverError('Failed to fetch integration', error);
  }
}

/**
 * PUT /api/admin/integrations/[id]
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return unauthorized('Missing access token');
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return unauthorized('Invalid access token');
    }

    const validation = await validateRequestBody(request, updateIntegrationSchema);
    if (validation.error) {
      return validation.error;
    }
    const payload = validation.data;

    const tenantSlug = request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

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
  } catch (error) {
    return serverError('Failed to update integration', error);
  }
}

/**
 * DELETE /api/admin/integrations/[id]
 * Soft delete by disconnecting the integration
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

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
  } catch (error) {
    return serverError('Failed to disconnect integration', error);
  }
}
