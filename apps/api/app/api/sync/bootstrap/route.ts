import { NextRequest } from 'next/server';
import {
  createServiceClient,
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

const QUICK_CAPTURE_BUCKET = 'quick-captures';

type QuickCaptureAvatarRow = {
  id: string;
  note: string | null;
  storage_path: string;
  captured_at: string;
};

function extractOrderIdFromQuickCaptureNote(note: string | null | undefined): string | null {
  if (!note) return null;
  const match = note.match(/order_id=([0-9a-f-]{36})/i);
  return match?.[1] ?? null;
}

/**
 * GET /api/sync/bootstrap
 *
 * Downloads all data needed to work offline:
 * - User profile
 * - Templates (with sections and items)
 * - Orders (for the next 14 days)
 * - Properties (for those orders)
 * - Clients (for those orders)
 * - Defect library
 * - Services
 *
 * Query params:
 * - business: business slug or business ID (required)
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
    const scope = request.nextUrl.searchParams.get('scope');
    const ordersOnlyScope = scope === 'orders';
    if (!businessIdentifier) {
      return applyCorsHeaders(badRequest('Missing business parameter'), request);
    }

    const supabase = createUserClient(accessToken);
    const serviceClient = createServiceClient();

    // Get tenant and verify membership
    const { data: tenantBySlug, error: tenantSlugError } = await supabase
      .from('tenants')
      .select('id, name, slug, business_id')
      .eq('slug', businessIdentifier)
      .maybeSingle();

    const tenantByBusinessId = !tenantBySlug
      ? await supabase
          .from('tenants')
          .select('id, name, slug, business_id')
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
      .select('id, role, profiles!inner(id, is_inspector)')
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
    const membershipProfileId =
      (membershipProfile as { id?: string } | undefined)?.id ?? null;
    const memberRole = (membership as { role?: string }).role;
    const hasInspectorAccess =
      memberRole === 'owner' ||
      memberRole === 'admin' ||
      memberRole === 'inspector' ||
      Boolean((membershipProfile as { is_inspector?: boolean } | undefined)?.is_inspector);

    if (!hasInspectorAccess) {
      return applyCorsHeaders(unauthorized('Inspector mobile access is restricted to inspector seats.'), request);
    }

    const inspectorIds = [user.userId];
    if (membershipProfileId && membershipProfileId !== user.userId) {
      // Backward compatibility: some orders were assigned using profile ids instead of auth user ids.
      inspectorIds.push(membershipProfileId);
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .eq('id', user.userId)
      .single();

    // Calculate date range for orders (today + 30 days)
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30);

    const startDateStr = today.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const templates = ordersOnlyScope
      ? []
      : (
          await supabase
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
            .eq('is_active', true)
            .order('name')
        ).data || [];

    // Get orders for this inspector in the date range
    const { data: ordersRaw } = await supabase
      .from('orders')
      .select('*')
      .eq('tenant_id', tenant.id)
      .in('inspector_id', inspectorIds)
      .gte('scheduled_date', startDateStr)
      .lte('scheduled_date', endDateStr)
      .order('scheduled_date')
      .order('scheduled_time');

    const orders = (ordersRaw || []).map((order) => ({
      ...order,
      // Normalize to auth user id so mobile local filters always match current inspector.
      inspector_id: user.userId,
    }));

    // Get unique property IDs and client IDs from orders
    const propertyIds = [...new Set((orders || []).map(o => o.property_id).filter(Boolean))];
    const clientIds = [...new Set((orders || []).map(o => o.client_id).filter(Boolean))];

    // Get properties for these orders
    const { data: properties } = propertyIds.length > 0
      ? await supabase
          .from('properties')
          .select('*')
          .in('id', propertyIds)
      : { data: [] };

    const orderIds = (orders || []).map(o => o.id);
    const propertyIdByOrderId = new Map(
      (orders || [])
        .filter((order) => Boolean(order.id && order.property_id))
        .map((order) => [order.id, order.property_id])
    );

    const propertyAvatarByPropertyId = new Map<string, string>();
    if (orderIds.length > 0 && properties && properties.length > 0) {
      const { data: quickCaptureRows } = await supabase
        .from('quick_capture_media')
        .select('id, note, storage_path, captured_at')
        .eq('tenant_id', tenant.id)
        .ilike('note', '%keep_for_property_avatar=true%')
        .order('captured_at', { ascending: false })
        .limit(500);

      const avatarRows = (quickCaptureRows ?? []) as QuickCaptureAvatarRow[];
      for (const row of avatarRows) {
        const orderId = extractOrderIdFromQuickCaptureNote(row.note);
        if (!orderId || !propertyIdByOrderId.has(orderId)) continue;
        const propertyId = propertyIdByOrderId.get(orderId);
        if (!propertyId || propertyAvatarByPropertyId.has(propertyId)) continue;

        const { data: signedData, error: signedError } = await serviceClient.storage
          .from(QUICK_CAPTURE_BUCKET)
          .createSignedUrl(row.storage_path, 60 * 60);

        if (signedError || !signedData?.signedUrl) continue;
        propertyAvatarByPropertyId.set(propertyId, signedData.signedUrl);
      }
    }

    const propertiesWithAvatars = (properties || []).map((property) => ({
      ...property,
      image_url: propertyAvatarByPropertyId.get(property.id) ?? null,
    }));

    // Get clients for these orders
    const { data: clients } = clientIds.length > 0
      ? await supabase
          .from('clients')
          .select('*')
          .in('id', clientIds)
      : { data: [] };

    const defectLibrary = ordersOnlyScope
      ? []
      : (
          await supabase
            .from('defect_library')
            .select('*')
            .eq('tenant_id', tenant.id)
            .order('category')
            .order('name')
        ).data || [];

    const services = ordersOnlyScope
      ? []
      : (
          await supabase
            .from('services')
            .select('*')
            .eq('tenant_id', tenant.id)
            .eq('is_active', true)
            .order('category')
            .order('name')
        ).data || [];

    const inspections = ordersOnlyScope
      ? []
      : orderIds.length > 0
        ? (
            await supabase
              .from('inspections')
              .select(`
                *,
                answers (*),
                findings (*),
                signatures (*)
              `)
              .in('order_id', orderIds)
          ).data || []
        : [];

    return applyCorsHeaders(Response.json({
      success: true,
      data: {
        business: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          business_id: tenant.business_id
        },
        user: {
          id: user.userId,
          email: profile?.email || user.email,
          full_name: profile?.full_name,
          avatar_url: profile?.avatar_url,
          role: membership.role
        },
        templates: templates || [],
        orders: orders || [],
        properties: propertiesWithAvatars,
        clients: clients || [],
        defect_library: defectLibrary || [],
        services: services || [],
        inspections: inspections || []
      },
      synced_at: new Date().toISOString()
    }), request);
  } catch (error) {
    console.error('[Sync Bootstrap] Error:', error);
    return applyCorsHeaders(serverError(), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return buildCorsPreflightResponse(request, 'GET, OPTIONS');
}
