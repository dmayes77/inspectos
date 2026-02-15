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
    .select('id, name, vendor_type, email, phone, status')
    .eq('tenant_id', tenant.id)
    .order('name');

  if (error) {
    return serverError('Failed to fetch vendors', error);
  }

  return success(
    (data ?? []).map((vendor: { id: string; name: string; vendor_type: string | null; email: string | null; phone: string | null; status: string }) => ({
      id: vendor.id,
      name: vendor.name,
      vendorType: vendor.vendor_type ?? undefined,
      email: vendor.email ?? undefined,
      phone: vendor.phone ?? undefined,
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
      vendor_type: payload.vendor_type ?? null,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      status: payload.status ?? 'active',
    })
    .select('id, name, vendor_type, email, phone, status')
    .single();

  if (error || !data) {
    return serverError(error?.message ?? 'Failed to create vendor.', error);
  }

  return success({
    id: data.id,
    name: data.name,
    vendorType: data.vendor_type ?? undefined,
    email: data.email ?? undefined,
    phone: data.phone ?? undefined,
    status: data.status,
  });
});
