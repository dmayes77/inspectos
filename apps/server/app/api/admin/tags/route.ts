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
import { createTagSchema } from '@/lib/validations/tag';

/**
 * GET /api/admin/tags
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
      .from('tags')
      .select('id, name, scope, tag_type, description, color, is_active')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('scope')
      .order('name');

    if (error) {
      return serverError('Failed to fetch tags', error);
    }

    return success(
      (data ?? []).map((tag) => ({
        id: tag.id,
        name: tag.name,
        scope: tag.scope,
        tagType: tag.tag_type,
        description: tag.description ?? undefined,
        color: tag.color ?? null,
        isActive: tag.is_active,
      }))
    );
  } catch (error) {
    return serverError('Failed to fetch tags', error);
  }
}

/**
 * POST /api/admin/tags
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

    const validation = await validateRequestBody(request, createTagSchema);
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

    const { data, error } = await supabase
      .from('tags')
      .insert({
        tenant_id: tenant.id,
        name: payload.name,
        scope: payload.scope,
        tag_type: payload.tagType ?? 'custom',
        description: payload.description ?? null,
        color: payload.color ?? null,
        is_active: true,
      })
      .select('id, name, scope, tag_type, description, color, is_active')
      .single();

    if (error || !data) {
      return serverError(error?.message ?? 'Failed to create tag.', error);
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
    return serverError('Failed to create tag', error);
  }
}
