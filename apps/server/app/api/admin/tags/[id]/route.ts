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
import { updateTagSchema } from '@/lib/validations/tag';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/admin/tags/[id]
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

    const validation = await validateRequestBody(request, updateTagSchema);
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

    const { data, error } = await supabase
      .from('tags')
      .update({
        name: payload.name,
        scope: payload.scope,
        tag_type: payload.tagType ?? 'custom',
        description: payload.description ?? null,
        color: payload.color ?? null,
      })
      .eq('tenant_id', tenant.id)
      .eq('id', id)
      .select('id, name, scope, tag_type, description, color, is_active')
      .single();

    if (error || !data) {
      return serverError(error?.message ?? 'Failed to update tag.', error);
    }

    return success({
      id: data.id,
      name: data.name,
      scope: data.scope,
      tagType: data.tag_type,
      description: data.description ?? undefined,
      color: data.color ?? null,
      isActive: data.is_active,
    });
  } catch (error) {
    return serverError('Failed to update tag', error);
  }
}

/**
 * DELETE /api/admin/tags/[id]
 * Soft delete by setting is_active to false
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

    const { data, error } = await supabase
      .from('tags')
      .update({ is_active: false })
      .eq('tenant_id', tenant.id)
      .eq('id', id)
      .select('id')
      .single();

    if (error || !data) {
      return serverError(error?.message ?? 'Failed to delete tag.', error);
    }

    return success(true);
  } catch (error) {
    return serverError('Failed to delete tag', error);
  }
}
