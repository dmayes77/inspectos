import { NextRequest } from 'next/server';
import {
  createUserClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  badRequest,
  notFound,
  serverError,
  success
} from '@/lib/supabase';
import { resolveTenant } from '@/lib/tenants';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/inspection-services/[id]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

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
    const { inspector_id, vendor_id, tenant_slug } = body;

    const tenantSlug = tenant_slug || request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

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
  } catch (error) {
    return serverError('Failed to update inspection service', error);
  }
}
