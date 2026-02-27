import { serverError, success } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';
import { validateRequestBody } from '@/lib/api/validate';
import { updateVendorSchema } from '@inspectos/shared/validations/vendor';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function resolveVendorLookup(id: string) {
  const value = id.trim();
  return UUID_REGEX.test(value)
    ? { column: 'id', value }
    : { column: 'public_id', value: value.toUpperCase() };
}

/**
 * GET /api/admin/vendors/[id]
 */
export const GET = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const { id } = params;
  const lookup = resolveVendorLookup(id);

  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq(lookup.column, lookup.value)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return serverError(error?.message ?? 'Vendor not found.', error);
  }

  return success({
    id: data.id,
    publicId: data.public_id,
    name: data.name,
    contactPerson: data.contact_person ?? undefined,
    vendorType: data.vendor_type ?? undefined,
    email: data.email ?? undefined,
    phone: data.phone ?? undefined,
    addressLine1: data.address_line1 ?? undefined,
    addressLine2: data.address_line2 ?? undefined,
    city: data.city ?? undefined,
    stateRegion: data.state_region ?? undefined,
    postalCode: data.postal_code ?? undefined,
    country: data.country ?? undefined,
    notes: data.notes ?? undefined,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  });
});

/**
 * PUT /api/admin/vendors/[id]
 */
export const PUT = withAuth<{ id: string }>(async ({ supabase, tenant, params, request }) => {
  const { id } = params;
  const lookup = resolveVendorLookup(id);

  const { data: existingVendor, error: existingVendorError } = await supabase
    .from('vendors')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq(lookup.column, lookup.value)
    .limit(1)
    .maybeSingle();

  if (existingVendorError || !existingVendor?.id) {
    return serverError(existingVendorError?.message ?? 'Vendor not found.', existingVendorError);
  }

  const validation = await validateRequestBody(request, updateVendorSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

  const updateData: Record<string, string | null> = {};
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.contact_person !== undefined) updateData.contact_person = payload.contact_person ?? null;
  if (payload.vendor_type !== undefined) updateData.vendor_type = payload.vendor_type ?? null;
  if (payload.email !== undefined) updateData.email = payload.email ?? null;
  if (payload.phone !== undefined) updateData.phone = payload.phone ?? null;
  if (payload.address_line1 !== undefined) updateData.address_line1 = payload.address_line1 ?? null;
  if (payload.address_line2 !== undefined) updateData.address_line2 = payload.address_line2 ?? null;
  if (payload.city !== undefined) updateData.city = payload.city ?? null;
  if (payload.state_region !== undefined) updateData.state_region = payload.state_region ?? null;
  if (payload.postal_code !== undefined) updateData.postal_code = payload.postal_code ?? null;
  if (payload.country !== undefined) updateData.country = payload.country ?? null;
  if (payload.notes !== undefined) updateData.notes = payload.notes ?? null;
  if (payload.status !== undefined) updateData.status = payload.status;

  const { data, error } = await supabase
    .from('vendors')
    .update(updateData)
    .eq('tenant_id', tenant.id)
    .eq('id', existingVendor.id)
    .select('id, public_id, name, contact_person, vendor_type, email, phone, address_line1, address_line2, city, state_region, postal_code, country, notes, status')
    .single();

  if (error || !data) {
    return serverError(error?.message ?? 'Failed to update vendor.', error);
  }

  return success({
    id: data.id,
    publicId: data.public_id,
    name: data.name,
    contactPerson: data.contact_person ?? undefined,
    vendorType: data.vendor_type ?? undefined,
    email: data.email ?? undefined,
    phone: data.phone ?? undefined,
    addressLine1: data.address_line1 ?? undefined,
    addressLine2: data.address_line2 ?? undefined,
    city: data.city ?? undefined,
    stateRegion: data.state_region ?? undefined,
    postalCode: data.postal_code ?? undefined,
    country: data.country ?? undefined,
    notes: data.notes ?? undefined,
    status: data.status,
  });
});

/**
 * DELETE /api/admin/vendors/[id]
 */
export const DELETE = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const { id } = params;
  const lookup = resolveVendorLookup(id);

  const { data: existingVendor, error: existingVendorError } = await supabase
    .from('vendors')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq(lookup.column, lookup.value)
    .limit(1)
    .maybeSingle();

  if (existingVendorError || !existingVendor?.id) {
    return serverError(existingVendorError?.message ?? 'Vendor not found.', existingVendorError);
  }

  const { error } = await supabase
    .from('vendors')
    .delete()
    .eq('tenant_id', tenant.id)
    .eq('id', existingVendor.id);

  if (error) {
    return serverError(error.message ?? 'Failed to delete vendor.', error);
  }

  return success(true);
});
