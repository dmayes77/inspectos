import { serverError, success } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';
import { validateRequestBody } from '@/lib/api/validate';
import { updateEmailTemplateSchema } from '@inspectos/shared/validations/email-template';

/**
 * PUT /api/admin/email-templates/[id]
 */
export const PUT = withAuth<{ id: string }>(async ({ supabase, tenant, params, request }) => {
  const { id } = params;

  const validation = await validateRequestBody(request, updateEmailTemplateSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

  const updateData: Record<string, string | null> = {};
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.subject !== undefined) updateData.subject = payload.subject;
  if (payload.body !== undefined) updateData.body = payload.body;
  if (payload.category !== undefined) updateData.category = payload.category ?? null;
  if (payload.description !== undefined) updateData.description = payload.description ?? null;

  const { data, error } = await supabase
    .from('email_templates')
    .update(updateData)
    .eq('tenant_id', tenant.id)
    .eq('id', id)
    .select('id, name, subject, body, category, description, is_system')
    .single();

  if (error || !data) {
    return serverError(error?.message ?? 'Failed to update email template.', error);
  }

  return success({
    id: data.id,
    name: data.name,
    subject: data.subject,
    body: data.body,
    category: data.category ?? null,
    description: data.description ?? null,
    isSystem: data.is_system,
  });
});

/**
 * DELETE /api/admin/email-templates/[id]
 */
export const DELETE = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const { id } = params;

  const { data, error } = await supabase
    .from('email_templates')
    .delete()
    .eq('tenant_id', tenant.id)
    .eq('id', id)
    .select('id')
    .single();

  if (error || !data) {
    return serverError(error?.message ?? 'Failed to delete email template.', error);
  }

  return success(true);
});
