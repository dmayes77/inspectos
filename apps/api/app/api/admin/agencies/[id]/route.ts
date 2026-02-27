import { serverError, success, validationError } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';
import { updateAgencySchema } from '@inspectos/shared/validations/agency';
import { parseRouteIdentifier } from '@/lib/identifiers/lookup';

/**
 * GET /api/admin/agencies/[id]
 */
export const GET = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const agencyId = parseRouteIdentifier(params.id);

  const { data: agency, error } = await supabase
    .from('agencies')
    .select(`
      *,
      agents:agents(id, name, email, phone, status, total_referrals, total_revenue)
    `)
    .eq('tenant_id', tenant.id)
    .eq('id', agencyId)
    .single();

  if (error || !agency) {
    return serverError('Agency not found', error);
  }

  return success(agency);
});

/**
 * PUT /api/admin/agencies/[id]
 */
export const PUT = withAuth<{ id: string }>(async ({ supabase, tenant, params, request }) => {
  const agencyId = parseRouteIdentifier(params.id);

  const body = await request.json();

  // Validate request body
  const validation = updateAgencySchema.safeParse(body);
  if (!validation.success) {
    return validationError(validation.error.issues[0]?.message || 'Validation failed');
  }
  const payload = validation.data;

  // Build update data
  const updateData: Record<string, unknown> = {};
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.logo_url !== undefined) updateData.logo_url = payload.logo_url;
  if (payload.license_number !== undefined) updateData.license_number = payload.license_number;
  if (payload.email !== undefined) updateData.email = payload.email;
  if (payload.phone !== undefined) updateData.phone = payload.phone;
  if (payload.website !== undefined) updateData.website = payload.website || null;
  if (payload.address_line1 !== undefined) updateData.address_line1 = payload.address_line1;
  if (payload.address_line2 !== undefined) updateData.address_line2 = payload.address_line2;
  if (payload.city !== undefined) updateData.city = payload.city;
  if (payload.state !== undefined) updateData.state = payload.state;
  if (payload.zip_code !== undefined) updateData.zip_code = payload.zip_code;
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.notes !== undefined) updateData.notes = payload.notes;

  const { data: agency, error } = await supabase
    .from('agencies')
    .update(updateData)
    .eq('tenant_id', tenant.id)
    .eq('id', agencyId)
    .select()
    .single();

  if (error || !agency) {
    return serverError('Failed to update agency', error);
  }

  return success(agency);
});

/**
 * DELETE /api/admin/agencies/[id]
 */
export const DELETE = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const agencyId = parseRouteIdentifier(params.id);

  const { error } = await supabase
    .from('agencies')
    .delete()
    .eq('tenant_id', tenant.id)
    .eq('id', agencyId);

  if (error) {
    return serverError('Failed to delete agency', error);
  }

  return success({ deleted: true });
});
