import { serverError, success } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';
import { validateRequestBody } from '@/lib/api/validate';
import { updateTagSchema } from '@inspectos/shared/validations/tag';

/**
 * PUT /api/admin/tags/[id]
 */
export const PUT = withAuth<{ id: string }>(async ({ supabase, tenant, params, request }) => {
  const { id } = params;

  const validation = await validateRequestBody(request, updateTagSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

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
});

/**
 * DELETE /api/admin/tags/[id]
 * Soft delete by setting is_active to false
 */
export const DELETE = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const { id } = params;

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
});
