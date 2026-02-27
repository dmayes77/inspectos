import { serverError, success } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';
import { validateRequestBody } from '@/lib/api/validate';
import { createVendorSchema } from '@inspectos/shared/validations/vendor';

/**
 * GET /api/admin/vendors
 */
export const GET = withAuth(async ({ supabase, tenant }) => {
  const { data, error } = await supabase
    .from('vendors')
    .select('id, public_id, name, contact_person, vendor_type, email, phone, address_line1, address_line2, city, state_region, postal_code, country, notes, status')
    .eq('tenant_id', tenant.id)
    .order('name');

  if (error) {
    return serverError('Failed to fetch vendors', error);
  }

  return success(
    (data ?? []).map((vendor: {
      id: string;
      public_id: string;
      name: string;
      contact_person: string | null;
      vendor_type: string | null;
      email: string | null;
      phone: string | null;
      address_line1: string | null;
      address_line2: string | null;
      city: string | null;
      state_region: string | null;
      postal_code: string | null;
      country: string | null;
      notes: string | null;
      status: string;
    }) => ({
      id: vendor.id,
      publicId: vendor.public_id,
      name: vendor.name,
      contactPerson: vendor.contact_person ?? undefined,
      vendorType: vendor.vendor_type ?? undefined,
      email: vendor.email ?? undefined,
      phone: vendor.phone ?? undefined,
      addressLine1: vendor.address_line1 ?? undefined,
      addressLine2: vendor.address_line2 ?? undefined,
      city: vendor.city ?? undefined,
      stateRegion: vendor.state_region ?? undefined,
      postalCode: vendor.postal_code ?? undefined,
      country: vendor.country ?? undefined,
      notes: vendor.notes ?? undefined,
      status: vendor.status,
    }))
  );
});

/**
 * POST /api/admin/vendors
 */
export const POST = withAuth(async ({ supabase, tenant, request }) => {
  const validation = await validateRequestBody(request, createVendorSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

  const { data, error } = await supabase
    .from('vendors')
    .insert({
      tenant_id: tenant.id,
      name: payload.name,
      contact_person: payload.contact_person ?? null,
      vendor_type: payload.vendor_type ?? null,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      address_line1: payload.address_line1 ?? null,
      address_line2: payload.address_line2 ?? null,
      city: payload.city ?? null,
      state_region: payload.state_region ?? null,
      postal_code: payload.postal_code ?? null,
      country: payload.country ?? null,
      notes: payload.notes ?? null,
      status: payload.status ?? 'active',
    })
    .select('id, public_id, name, contact_person, vendor_type, email, phone, address_line1, address_line2, city, state_region, postal_code, country, notes, status')
    .single();

  if (error || !data) {
    return serverError(error?.message ?? 'Failed to create vendor.', error);
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
