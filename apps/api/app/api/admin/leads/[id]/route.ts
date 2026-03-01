import { serverError, success, validationError, notFound } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';
import { updateLeadSchema } from '@inspectos/shared/validations/lead';
import { normalizePhoneForStorage } from '@/lib/phone/normalize';

const normalizeStage = (stage?: string | null) => {
  if (!stage) return "new";
  return stage.toLowerCase().replace(/\s+/g, "_");
};

const mapLead = (lead: {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  stage: string;
  source: string | null;
  notes: string | null;
  service_name?: string | null;
  requested_date?: string | null;
  estimated_value?: number | null;
}) => ({
  leadId: lead.id,
  name: lead.name,
  email: lead.email ?? "",
  phone: lead.phone ?? "",
  stage: lead.stage,
  source: lead.source ?? "",
  notes: lead.notes ?? "",
  serviceName: lead.service_name ?? "",
  requestedDate: lead.requested_date ?? "",
  estimatedValue: Number(lead.estimated_value ?? 0),
});

/**
 * GET /api/admin/leads/[id]
 */
export const GET = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const { id } = params;

  const { data: lead, error } = await supabase
    .from('leads')
    .select('id, name, email, phone, stage, source, notes, service_name, requested_date, estimated_value')
    .eq('tenant_id', tenant.id)
    .eq('id', id)
    .single();

  if (error || !lead) {
    return notFound('Lead not found');
  }

  return success(mapLead(lead));
});

/**
 * PUT /api/admin/leads/[id]
 */
export const PUT = withAuth<{ id: string }>(async ({ supabase, tenant, params, request }) => {
  const { id } = params;

  const body = await request.json();

  // Validate request body
  const validation = updateLeadSchema.safeParse(body);
  if (!validation.success) {
    return validationError(validation.error.issues[0]?.message || 'Validation failed');
  }
  const payload = validation.data;

  // TODO: Add workflow trigger on status change (like web version)
  // const { data: existing } = await supabase.from('leads').select('stage').eq('tenant_id', tenant.id).eq('id', id).maybeSingle();

  const { data: lead, error } = await supabase
    .from('leads')
    .update({
      name: payload.name,
      email: payload.email ?? null,
      phone: normalizePhoneForStorage(payload.phone),
      stage: normalizeStage(payload.stage),
      source: payload.source ?? null,
      notes: payload.notes ?? null,
      service_name: payload.serviceName ?? null,
      requested_date: payload.requestedDate || null,
      estimated_value: payload.estimatedValue ?? null,
    })
    .eq('tenant_id', tenant.id)
    .eq('id', id)
    .select('id, name, email, phone, stage, source, notes, service_name, requested_date, estimated_value')
    .single();

  if (error || !lead) {
    return serverError('Failed to update lead', error);
  }

  return success(mapLead(lead));
});

/**
 * DELETE /api/admin/leads/[id]
 */
export const DELETE = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const { id } = params;

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('tenant_id', tenant.id)
    .eq('id', id);

  if (error) {
    return serverError('Failed to delete lead', error);
  }

  return success({ deleted: true });
});
