import {
  createServiceClient,
  badRequest,
  serverError,
  success,
  validationError
} from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';
import { updateAgentSchema } from '@inspectos/shared/validations/agent';
import { resolveAgencyAssociation } from '@/lib/agents/agency-helpers';

/**
 * GET /api/admin/agents/[id]
 */
export const GET = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const { id } = params;

  const { data: agent, error } = await supabase
    .from('agents')
    .select(`
      *,
      agency:agencies(id, name, email, phone, website, address_line1, address_line2, city, state, zip_code),
      orders(id, order_number, status, scheduled_date, total, property:properties(address_line1, city, state))
    `)
    .eq('tenant_id', tenant.id)
    .eq('id', id)
    .single();

  if (error || !agent) {
    return serverError('Agent not found', error);
  }

  return success(agent);
});

/**
 * PUT /api/admin/agents/[id]
 */
export const PUT = withAuth<{ id: string }>(async ({ supabase, tenant, params, request }) => {
  const { id } = params;

  const body = await request.json();

  // Validate request body
  const validation = updateAgentSchema.safeParse(body);
  if (!validation.success) {
    return validationError(validation.error.issues[0]?.message || 'Validation failed');
  }
  const payload = validation.data;

  // Resolve agency association if needed
  let resolvedAgencyId: string | null | undefined;
  if (payload.agency_id !== undefined || (payload.agency_name && payload.agency_name.trim().length > 0)) {
    try {
      resolvedAgencyId = await resolveAgencyAssociation({
        tenantId: tenant.id,
        agencyId: payload.agency_id ?? null,
        agencyName: payload.agency_name ?? null,
        brandLogoUrl: payload.brand_logo_url ?? null,
        agencyAddress: payload.agency_address ?? null,
        agencyWebsite: payload.agency_website ?? null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to prepare agency.';
      return serverError(message, error);
    }
  }

  // Build update data
  const updateData: Record<string, unknown> = {};
  if (resolvedAgencyId !== undefined) updateData.agency_id = resolvedAgencyId;
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.email !== undefined) updateData.email = payload.email;
  if (payload.phone !== undefined) updateData.phone = payload.phone;
  if (payload.role !== undefined) updateData.role = payload.role;
  if (payload.license_number !== undefined) updateData.license_number = payload.license_number;
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.notes !== undefined) updateData.notes = payload.notes;
  if (payload.preferred_report_format !== undefined) updateData.preferred_report_format = payload.preferred_report_format;
  if (payload.notify_on_schedule !== undefined) updateData.notify_on_schedule = payload.notify_on_schedule;
  if (payload.notify_on_complete !== undefined) updateData.notify_on_complete = payload.notify_on_complete;
  if (payload.notify_on_report !== undefined) updateData.notify_on_report = payload.notify_on_report;
  if (payload.avatar_url !== undefined) updateData.avatar_url = payload.avatar_url;
  if (payload.brand_logo_url !== undefined) updateData.brand_logo_url = payload.brand_logo_url;
  if (payload.agency_address !== undefined) updateData.agency_address = payload.agency_address;

  const { data: agent, error } = await supabase
    .from('agents')
    .update(updateData)
    .eq('tenant_id', tenant.id)
    .eq('id', id)
    .select(`
      *,
      agency:agencies(id, name, email, phone, website, address_line1, address_line2, city, state, zip_code)
    `)
    .single();

  if (error || !agent) {
    return serverError('Failed to update agent', error);
  }

  return success(agent);
});

/**
 * DELETE /api/admin/agents/[id]
 */
export const DELETE = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const { id } = params;

  // Check if agent has active orders using service client
  const serviceClient = createServiceClient();
  const { count } = await serviceClient
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', id)
    .in('status', ['pending', 'scheduled', 'in_progress']);

  if (count && count > 0) {
    return badRequest('Cannot delete agent with active orders. Complete or reassign orders first.');
  }

  const { error } = await supabase
    .from('agents')
    .delete()
    .eq('tenant_id', tenant.id)
    .eq('id', id);

  if (error) {
    return serverError('Failed to delete agent', error);
  }

  return success({ deleted: true });
});
