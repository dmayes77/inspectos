import { NextRequest } from 'next/server';
import {
  createUserClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  badRequest,
  serverError,
  success
} from '@/lib/supabase';
import { resolveTenant } from '@/lib/tenants';

type ServiceUpdate = {
  id: string;
  inspector_id?: string | null;
  vendor_id?: string | null;
};

/**
 * PATCH /api/admin/inspection-services/batch
 */
export async function PATCH(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return unauthorized('Missing access token');
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return unauthorized('Invalid access token');
    }

    const body = await request.json();
    const updates: ServiceUpdate[] = body.updates ?? [];
    const { tenant_slug } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return badRequest('No updates provided');
    }

    const tenantSlug = tenant_slug || request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
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
  } catch (error) {
    return serverError('Failed to update inspection services', error);
  }
}
