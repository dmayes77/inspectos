import { notFound, serverError, success, unauthorized } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';

/**
 * PATCH /api/admin/inspection-services/[id]
 */
export const PATCH = withAuth<{ id: string }>(async ({ supabase, tenant, params, request }) => {
  const { id } = params;

  const body = await request.json();
  const { inspector_id, vendor_id } = body;

  // Verify the inspection service belongs to this tenant
  const { data: service, error: fetchError } = await supabase
    .from('inspection_services')
    .select('inspection_id, inspections!inner(tenant_id)')
    .eq('id', id)
    .single();

  if (fetchError || !service) {
    return notFound('Inspection service not found');
  }

  const inspections = service.inspections as unknown as { tenant_id: string } | { tenant_id: string }[];
  const inspection = Array.isArray(inspections) ? inspections[0] : inspections;

  if (inspection.tenant_id !== tenant.id) {
    return unauthorized('Unauthorized');
  }

  // Update the inspection service
  const updateData: { inspector_id?: string | null; vendor_id?: string | null } = {};
  if (inspector_id !== undefined) {
    updateData.inspector_id = inspector_id;
  }
  if (vendor_id !== undefined) {
    updateData.vendor_id = vendor_id;
  }

  const { data: updated, error: updateError } = await supabase
    .from('inspection_services')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      inspector:inspector_id(id, full_name, email, avatar_url),
      vendor:vendor_id(id, name, type, contact)
    `)
    .single();

  if (updateError) {
    return serverError('Failed to update inspection service', updateError);
  }

  return success(updated);
});
