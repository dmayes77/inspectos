import { serverError, success, validationError } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';
import { updateServiceSchema } from '@inspectos/shared/validations/service';
import { triggerWebhookEvent } from '@/lib/webhooks/delivery';
import { buildServicePayload } from '@/lib/webhooks/payloads';

/**
 * GET /api/admin/services/[id]
 */
export const GET = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const { id } = params;

  const { data: service, error } = await supabase
    .from('services')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('id', id)
    .single();

  if (error || !service) {
    return serverError('Service not found', error);
  }

  return success({
    serviceId: service.id,
    name: service.name,
    price: service.price ?? undefined,
    durationMinutes: service.duration_minutes ?? undefined,
    templateId: service.template_id ?? null,
    description: service.description ?? undefined,
    category: service.category ?? undefined,
    status: service.is_active ? 'active' : 'inactive'
  });
});

/**
 * PUT /api/admin/services/[id]
 */
export const PUT = withAuth<{ id: string }>(async ({ supabase, tenant, params, request }) => {
  const { id } = params;

  const body = await request.json();

  // Validate request body
  const validation = updateServiceSchema.safeParse(body);
  if (!validation.success) {
    return validationError(validation.error.issues[0]?.message || 'Validation failed');
  }
  const payload = validation.data;

  // Build update data
  const updateData: Record<string, unknown> = {};
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.description !== undefined) updateData.description = payload.description;
  if (payload.price !== undefined) updateData.price = payload.price;
  if (payload.durationMinutes !== undefined) updateData.duration_minutes = payload.durationMinutes;
  if (payload.category !== undefined) updateData.category = payload.category;
  if (payload.templateId !== undefined) updateData.template_id = payload.templateId;

  const { data: service, error } = await supabase
    .from('services')
    .update(updateData)
    .eq('tenant_id', tenant.id)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !service) {
    return serverError('Failed to update service', error);
  }

  // Trigger webhook for service.updated event
  try {
    triggerWebhookEvent("service.updated", tenant.id, buildServicePayload(service));
  } catch (webhookError) {
    console.error("Failed to trigger webhook:", webhookError);
  }

  return success({
    serviceId: service.id,
    name: service.name,
    price: service.price ?? undefined,
    durationMinutes: service.duration_minutes ?? undefined,
    templateId: service.template_id ?? null,
    description: service.description ?? undefined,
    category: service.category ?? undefined,
    status: service.is_active ? 'active' : 'inactive'
  });
});

/**
 * DELETE /api/admin/services/[id]
 */
export const DELETE = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const { id } = params;

  // Soft delete by setting is_active to false
  const { error } = await supabase
    .from('services')
    .update({ is_active: false })
    .eq('tenant_id', tenant.id)
    .eq('id', id);

  if (error) {
    return serverError('Failed to delete service', error);
  }

  return success({ deleted: true });
});
