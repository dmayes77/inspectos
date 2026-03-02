import { NextRequest } from 'next/server';
import {
  createUserClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  badRequest,
  paymentRequired,
  serverError
} from '@/lib/supabase';
import { verifyBusinessBillingAccessByTenantId } from '@/lib/billing/access';
import { applyCorsHeaders, buildCorsPreflightResponse } from '@/lib/cors';

/**
 * GET /api/sync/pull
 *
 * Pulls changes since the last sync for incremental updates.
 *
 * Query params:
 * - business: business slug or business ID (required)
 * - since: ISO timestamp of last sync (optional, if not provided returns all)
 * - entities: comma-separated list of entity types to pull (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return applyCorsHeaders(unauthorized('Missing access token'), request);
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return applyCorsHeaders(unauthorized('Invalid access token'), request);
    }

    const businessIdentifier = request.nextUrl.searchParams.get('business');
    if (!businessIdentifier) {
      return applyCorsHeaders(badRequest('Missing business parameter'), request);
    }

    const since = request.nextUrl.searchParams.get('since');
    const entitiesParam = request.nextUrl.searchParams.get('entities');
    const requestedEntities = entitiesParam ? entitiesParam.split(',') : null;

    const supabase = createUserClient(accessToken);

    // Get tenant and verify membership
    const { data: tenantBySlug, error: tenantSlugError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', businessIdentifier)
      .maybeSingle();

    const tenantByBusinessId = !tenantBySlug
      ? await supabase
          .from('tenants')
          .select('id')
          .eq('business_id', businessIdentifier.toUpperCase())
          .maybeSingle()
      : { data: null, error: null };

    const tenant = tenantBySlug ?? tenantByBusinessId.data;
    const tenantError = tenantBySlug ? tenantSlugError : tenantByBusinessId.error;

    if (tenantError || !tenant) {
      return applyCorsHeaders(badRequest('Business not found'), request);
    }

    // Verify user is a member of this tenant
    const { data: membership, error: membershipError } = await supabase
      .from('tenant_members')
      .select('id, role, profiles!inner(is_inspector)')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user.userId)
      .single();

    if (membershipError || !membership) {
      return applyCorsHeaders(unauthorized('Not a member of this business'), request);
    }

    const billingAccess = await verifyBusinessBillingAccessByTenantId(supabase, tenant.id);
    if (billingAccess.error) {
      return applyCorsHeaders(serverError('Failed to verify business billing status', billingAccess.error), request);
    }
    if (!billingAccess.allowed) {
      return applyCorsHeaders(paymentRequired('Business subscription is unpaid. Access is disabled until payment is received.'), request);
    }

    const membershipProfile = Array.isArray((membership as { profiles?: unknown[] }).profiles)
      ? (membership as { profiles?: unknown[] }).profiles?.[0]
      : (membership as { profiles?: unknown }).profiles;
    const hasInspectorAccess =
      (membership as { role?: string }).role === 'inspector' ||
      Boolean((membershipProfile as { is_inspector?: boolean } | undefined)?.is_inspector);

    if (!hasInspectorAccess) {
      return applyCorsHeaders(unauthorized('Inspector mobile access is restricted to inspector seats.'), request);
    }

    const changes: Record<string, unknown[]> = {};
    const shouldPull = (entity: string) => !requestedEntities || requestedEntities.includes(entity);

    // Pull templates if updated
    if (shouldPull('templates')) {
      let query = supabase
        .from('templates')
        .select(`
          id, tenant_id, name, description, version, is_active, created_at, updated_at,
          template_sections (
            id, template_id, name, description, sort_order, created_at, updated_at,
            template_items (
              id, section_id, name, description, item_type, options, is_required, sort_order, created_at, updated_at
            )
          )
        `)
        .eq('tenant_id', tenant.id)
        .eq('is_active', true);

      if (since) {
        query = query.gt('updated_at', since);
      }

      const { data } = await query;
      changes.templates = data || [];
    }

    // Pull orders
    if (shouldPull('orders')) {
      // Get orders for this inspector (next 14 days)
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 14);

      let query = supabase
        .from('orders')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('inspector_id', user.userId)
        .gte('scheduled_date', today.toISOString().split('T')[0])
        .lte('scheduled_date', endDate.toISOString().split('T')[0]);

      if (since) {
        query = query.gt('updated_at', since);
      }

      const { data } = await query;
      changes.orders = data || [];

      // Also get related properties and clients
      if (data && data.length > 0) {
        const propertyIds = [...new Set(data.map(j => j.property_id).filter(Boolean))];
        const clientIds = [...new Set(data.map(j => j.client_id).filter(Boolean))];

        if (propertyIds.length > 0) {
          const { data: properties } = await supabase
            .from('properties')
            .select('*')
            .in('id', propertyIds);
          changes.properties = properties || [];
        }

        if (clientIds.length > 0) {
          const { data: clients } = await supabase
            .from('clients')
            .select('*')
            .in('id', clientIds);
          changes.clients = clients || [];
        }
      }
    }

    // Pull inspections (for this user's orders)
    if (shouldPull('inspections')) {
      // First get the user's order IDs
      const { data: userOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('inspector_id', user.userId);

      const orderIds = (userOrders || []).map(o => o.id);

      if (orderIds.length > 0) {
        let query = supabase
          .from('inspections')
          .select(`
            *,
            answers (*),
            findings (*),
            signatures (*)
          `)
          .in('order_id', orderIds);

        if (since) {
          query = query.gt('updated_at', since);
        }

        const { data } = await query;
        changes.inspections = data || [];
      }
    }

    // Pull defect library
    if (shouldPull('defect_library')) {
      let query = supabase
        .from('defect_library')
        .select('*')
        .eq('tenant_id', tenant.id);

      if (since) {
        query = query.gt('updated_at', since);
      }

      const { data } = await query;
      changes.defect_library = data || [];
    }

    // Pull services
    if (shouldPull('services')) {
      let query = supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true);

      if (since) {
        query = query.gt('updated_at', since);
      }

      const { data } = await query;
      changes.services = data || [];
    }

    return applyCorsHeaders(Response.json({
      success: true,
      changes,
      synced_at: new Date().toISOString()
    }), request);
  } catch (error) {
    console.error('[Sync Pull] Error:', error);
    return applyCorsHeaders(serverError(), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return buildCorsPreflightResponse(request, 'GET, OPTIONS');
}
