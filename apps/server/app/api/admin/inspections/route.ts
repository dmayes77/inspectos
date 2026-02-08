import { NextRequest } from 'next/server';
import {
  createUserClient,
  createServiceClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  badRequest,
  serverError,
  success
} from '@/lib/supabase';
import { resolveTenant } from '@/lib/tenants';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/inspections
 *
 * Query params:
 * - tenant: tenant slug (optional; defaults to user's first tenant)
 * - status: filter by status (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return unauthorized('Missing access token');
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return unauthorized('Invalid access token');
    }

    const tenantSlug = request.nextUrl.searchParams.get('tenant');
    const status = request.nextUrl.searchParams.get('status');

    const userSupabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(userSupabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    const supabase = createServiceClient();

    // Fetch inspections
    let inspectionsQuery = supabase
      .from('inspections')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    if (status) {
      inspectionsQuery = inspectionsQuery.eq('status', status);
    }

    const { data: inspections, error: inspectionsError } = await inspectionsQuery;
    if (inspectionsError) {
      logger.error('Failed to fetch inspections', {
        operation: 'fetch_inspections',
        tenantId: tenant.id,
        error: inspectionsError
      });
      return serverError('Failed to fetch inspections', inspectionsError);
    }

    logger.info('Fetched inspections', {
      operation: 'fetch_inspections',
      tenantId: tenant.id,
      count: inspections?.length || 0,
      sampleId: inspections?.[0]?.id,
      sampleOrderId: inspections?.[0]?.order_id,
      sampleStatus: inspections?.[0]?.status
    });

    if (!inspections || inspections.length === 0) {
      logger.info('No inspections found', {
        operation: 'fetch_inspections',
        tenantId: tenant.id
      });
      return success([]);
    }

    // Collect unique order IDs
    const orderIds = [...new Set(inspections.map(i => i.order_id).filter(Boolean))];
    logger.info('Fetching orders with relations', {
      operation: 'fetch_orders',
      tenantId: tenant.id,
      orderCount: orderIds.length,
      sampleOrderIds: orderIds.slice(0, 3)
    });

    // Fetch related orders with nested data
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        scheduled_date,
        status,
        property_id,
        client_id,
        inspector_id,
        properties!property_id(
          id,
          address_line1,
          address_line2,
          city,
          state,
          zip_code
        ),
        clients!client_id(
          id,
          name,
          email,
          phone,
          company
        ),
        profiles!inspector_id(
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .in('id', orderIds);

    if (ordersError) {
      logger.error('Failed to fetch orders with relations', {
        operation: 'fetch_orders',
        tenantId: tenant.id,
        orderIds: orderIds,
        error: ordersError
      });
    }

    // Transform the orders data to rename properties/clients/profiles to property/client/inspector
    const transformedOrders = (orders || []).map(order => ({
      id: order.id,
      scheduled_date: order.scheduled_date,
      status: order.status,
      property: order.properties || null,
      client: order.clients || null,
      inspector: order.profiles || null,
    }));

    logger.info('Fetched orders with relations', {
      operation: 'fetch_orders',
      tenantId: tenant.id,
      orderCount: transformedOrders.length,
      sampleOrderId: transformedOrders[0]?.id,
      hasProperty: !!transformedOrders[0]?.property,
      hasClient: !!transformedOrders[0]?.client,
      hasInspector: !!transformedOrders[0]?.inspector,
      sampleProperty: transformedOrders[0]?.property,
      sampleClient: transformedOrders[0]?.client,
      sampleInspector: transformedOrders[0]?.inspector
    });

    // Build order lookup map
    const orderMap = new Map(transformedOrders.map(o => [o.id, o]));

    // Merge inspections with order data
    const result = inspections.map(inspection => ({
      ...inspection,
      order: orderMap.get(inspection.order_id) || null
    }));

    logger.info('Merged inspections with order data', {
      operation: 'merge_results',
      tenantId: tenant.id,
      resultCount: result.length,
      sampleInspectionId: result[0]?.id,
      sampleOrderId: result[0]?.order_id,
      sampleHasOrder: !!result[0]?.order,
      sampleHasProperty: !!result[0]?.order?.property,
      sampleHasClient: !!result[0]?.order?.client,
      sampleHasInspector: !!result[0]?.order?.inspector,
      inspectionsWithoutOrders: result.filter(r => !r.order).length
    });

    return success(result);
  } catch (error) {
    return serverError('Failed to fetch inspections', error);
  }
}

/**
 * POST /api/admin/inspections
 */
export async function POST(request: NextRequest) {
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
    const {
      tenant_slug,
      order_id,
      order_schedule_id,
      template_id,
      template_version,
      status,
      started_at,
      completed_at,
      weather_conditions,
      temperature,
      present_parties,
      notes,
      selected_type_ids
    } = body;

    if (!order_id || !template_id) {
      return badRequest('Missing required fields: order_id, template_id');
    }

    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenant_slug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    const { data: inspection, error } = await supabase
      .from('inspections')
      .insert({
        tenant_id: tenant.id,
        order_id,
        order_schedule_id: order_schedule_id || null,
        template_id,
        template_version: template_version || 1,
        status: status || 'draft',
        started_at: started_at || null,
        completed_at: completed_at || null,
        weather_conditions: weather_conditions || null,
        temperature: temperature || null,
        present_parties: present_parties || null,
        notes: notes || null,
        selected_type_ids: selected_type_ids || []
      })
      .select('*')
      .single();

    if (error || !inspection) {
      return serverError('Failed to create inspection', error);
    }

    return success(inspection);
  } catch (error) {
    return serverError('Failed to create inspection', error);
  }
}
