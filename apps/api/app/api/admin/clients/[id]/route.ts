import { serverError, success, validationError, notFound } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';
import { updateClientSchema } from '@inspectos/shared/validations/client';
import { triggerWebhookEvent } from '@/lib/webhooks/delivery';
import { buildClientPayload } from '@/lib/webhooks/payloads';
import { resolveIdLookup } from '@/lib/identifiers/lookup';
import { normalizePhoneForStorage } from '@/lib/phone/normalize';

const mapClient = (client: Record<string, unknown>) => ({
  clientId: client.id,
  publicId: client.public_id,
  name: client.name,
  email: client.email || '',
  phone: client.phone || '',
  type: client.type || 'Homebuyer',
  company: client.company || '',
  notes: client.notes || '',
  inspections: client.inspections_count || 0,
  lastInspection: client.last_inspection_date || '—',
  totalSpent: Number(client.total_spent || 0),
  createdAt: client.created_at,
  updatedAt: client.updated_at,
});

/**
 * GET /api/admin/clients/[id]
 */
export const GET = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const { id } = params;
  const lookup = resolveIdLookup(id);

  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq(lookup.column, lookup.value)
    .limit(1)
    .maybeSingle();

  if (error || !client) return notFound('Client not found');

  return success(mapClient(client));
});

/**
 * PUT /api/admin/clients/[id]
 */
export const PUT = withAuth<{ id: string }>(async ({ supabase, tenant, params, request }) => {
  const { id } = params;
  const lookup = resolveIdLookup(id);

  const { data: existingClient, error: existingClientError } = await supabase
    .from('clients')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq(lookup.column, lookup.value)
    .limit(1)
    .maybeSingle();

  if (existingClientError || !existingClient?.id) return notFound('Client not found');

  const body = await request.json();

  const validation = updateClientSchema.safeParse(body);
  if (!validation.success) {
    return validationError(validation.error.issues[0]?.message || 'Validation failed');
  }
  const payload = validation.data;

  const updateData: Record<string, unknown> = {};
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.email !== undefined) updateData.email = payload.email;
  if (payload.phone !== undefined) updateData.phone = normalizePhoneForStorage(payload.phone);
  if (payload.type !== undefined) updateData.type = payload.type;
  if (payload.company !== undefined) updateData.company = payload.company;
  if (payload.notes !== undefined) updateData.notes = payload.notes;

  const { data: client, error } = await supabase
    .from('clients')
    .update(updateData)
    .eq('tenant_id', tenant.id)
    .eq('id', existingClient.id)
    .select('*')
    .single();

  if (error || !client) return serverError('Failed to update client', error);

  // Trigger webhook
  try {
    triggerWebhookEvent("client.updated", tenant.id, buildClientPayload(client));
  } catch (webhookError) {
    console.error("Failed to trigger webhook:", webhookError);
  }

  return success(mapClient(client));
});

/**
 * DELETE /api/admin/clients/[id]
 */
export const DELETE = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const { id } = params;
  const lookup = resolveIdLookup(id);

  const { data: existingClient, error: existingClientError } = await supabase
    .from('clients')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq(lookup.column, lookup.value)
    .limit(1)
    .maybeSingle();

  if (existingClientError || !existingClient?.id) return notFound('Client not found');

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('tenant_id', tenant.id)
    .eq('id', existingClient.id);

  if (error) return serverError('Failed to delete client', error);

  return success({ deleted: true });
});
