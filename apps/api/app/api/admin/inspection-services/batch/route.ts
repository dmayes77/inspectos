import { badRequest, serverError, success, unauthorized } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';

type ServiceUpdate = {
  id: string;
  inspector_id?: string | null;
  vendor_id?: string | null;
};

/**
 * PATCH /api/admin/inspection-services/batch
 */
export const PATCH = withAuth(async ({ supabase, tenant, request }) => {
  const body = await request.json();
  const updates: ServiceUpdate[] = body.updates ?? [];

  if (!Array.isArray(updates) || updates.length === 0) {
    return badRequest('No updates provided');
  }

  const serviceIds = updates.map((u) => u.id);

  // Verify all services belong to this tenant
  const { data: services, error: fetchError } = await supabase
    .from('inspection_services')
    .select('id, inspection_id, inspections!inner(tenant_id)')
    .in('id', serviceIds);

  if (fetchError || !services) {
    return serverError('Failed to fetch services', fetchError);
  }

  // Check tenant access for all services
  for (const service of services) {
    const inspections = service.inspections as unknown as { tenant_id: string } | { tenant_id: string }[];
    const inspection = Array.isArray(inspections) ? inspections[0] : inspections;
    if (inspection.tenant_id !== tenant.id) {
      return unauthorized('Unauthorized');
    }
  }

  // Perform updates
  const results = [];
  for (const update of updates) {
    const updateData: { inspector_id?: string | null; vendor_id?: string | null } = {};
    if (update.inspector_id !== undefined) {
      updateData.inspector_id = update.inspector_id;
    }
    if (update.vendor_id !== undefined) {
      updateData.vendor_id = update.vendor_id;
    }

    const { data, error } = await supabase
      .from('inspection_services')
      .update(updateData)
      .eq('id', update.id)
      .select()
      .single();

    if (error) {
      return serverError(`Failed to update service ${update.id}`, error);
    }

    results.push(data);
  }

  return success({ updated: results });
});
