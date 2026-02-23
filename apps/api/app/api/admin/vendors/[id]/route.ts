import { serverError, success } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';
import { validateRequestBody } from '@/lib/api/validate';
import { updateVendorSchema } from '@inspectos/shared/validations/vendor';

/**
 * GET /api/admin/vendors/[id]
 */
export const GET = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const { id } = params;

  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('id', id)
    .single();

  if (error || !data) {
    return serverError(error?.message ?? 'Vendor not found.', error);
  }

  return success({
    id: data.id,
    name: data.name,
    vendorType: data.vendor_type ?? undefined,
    email: data.email ?? undefined,
    phone: data.phone ?? undefined,
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

  const validation = await validateRequestBody(request, updateVendorSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

  const updateData: Record<string, string | null> = {};
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.vendor_type !== undefined) updateData.vendor_type = payload.vendor_type ?? null;
  if (payload.email !== undefined) updateData.email = payload.email ?? null;
  if (payload.phone !== undefined) updateData.phone = payload.phone ?? null;
  if (payload.status !== undefined) updateData.status = payload.status;

  const { data, error } = await supabase
    .from('vendors')
    .update(updateData)
    .eq('tenant_id', tenant.id)
    .eq('id', id)
    .select('id, name, vendor_type, email, phone, status')
    .single();

  if (error || !data) {
    return serverError(error?.message ?? 'Failed to update vendor.', error);
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

/**
 * DELETE /api/admin/vendors/[id]
 */
export const DELETE = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const { id } = params;

  const { error } = await supabase
    .from('vendors')
    .delete()
    .eq('tenant_id', tenant.id)
    .eq('id', id);

  if (error) {
    return serverError(error.message ?? 'Failed to delete vendor.', error);
  }

  return success(true);
});
