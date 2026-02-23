import { serverError, success } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';
import { validateRequestBody } from '@/lib/api/validate';
import { createTagSchema } from '@inspectos/shared/validations/tag';

/**
 * GET /api/admin/tags
 */
export const GET = withAuth(async ({ supabase, tenant }) => {
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
});

/**
 * POST /api/admin/tags
 */
export const POST = withAuth(async ({ supabase, tenant, request }) => {
  const validation = await validateRequestBody(request, createTagSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

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
});
