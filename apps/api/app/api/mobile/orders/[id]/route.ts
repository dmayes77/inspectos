import type { NextRequest } from 'next/server';
import { applyCorsHeaders, buildCorsPreflightResponse } from '@/lib/cors';
import {
  badRequest,
  createUserClient,
  getAccessToken,
  getUserFromToken,
  serverError,
  unauthorized,
} from '@/lib/supabase';
import { resolveIdLookup } from '@/lib/identifiers/lookup';

type MembershipRow = {
  role: string;
  profiles: { id?: string; is_inspector?: boolean } | { id?: string; is_inspector?: boolean }[] | null;
};

function normalizeProfile(row: MembershipRow): { id?: string; is_inspector?: boolean } | null {
  const profile = row.profiles;
  if (Array.isArray(profile)) return profile[0] ?? null;
  return profile ?? null;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return applyCorsHeaders(unauthorized('Missing access token'), request);
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return applyCorsHeaders(unauthorized('Invalid access token'), request);
    }

    const { id } = await context.params;
    const businessIdentifier = request.nextUrl.searchParams.get('business');
    if (!businessIdentifier) {
      return applyCorsHeaders(badRequest('Missing business parameter'), request);
    }

    const lookup = resolveIdLookup(id, {
      publicColumn: 'order_number',
      transformPublicValue: (value) => value.toUpperCase(),
    });

    const supabase = createUserClient(accessToken);

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

    const { data: membershipRaw, error: membershipError } = await supabase
      .from('tenant_members')
      .select('role, profiles!left(id, is_inspector)')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user.userId)
      .single();

    const membership = membershipRaw as MembershipRow | null;
    if (membershipError || !membership) {
      return applyCorsHeaders(unauthorized('Not a member of this business'), request);
    }

    const profile = normalizeProfile(membership);
    const role = membership.role;
    const hasInspectorAccess =
      role === 'owner' ||
      role === 'admin' ||
      role === 'inspector' ||
      Boolean(profile?.is_inspector);

    if (!hasInspectorAccess) {
      return applyCorsHeaders(unauthorized('Inspector mobile access is restricted to inspector seats.'), request);
    }

    const inspectorIds = [user.userId];
    if (profile?.id && profile.id !== user.userId) {
      inspectorIds.push(profile.id);
    }

    let orderQuery = supabase
      .from('orders')
      .select(`
        *,
        property:properties(id, address_line1, address_line2, city, state, zip_code, property_type),
        client:clients(id, name, email, phone),
        inspector:profiles(id, full_name, email, avatar_url)
      `)
      .eq(lookup.column, lookup.value)
      .eq('tenant_id', tenant.id);

    // Restrict inspectors to only their assigned orders; owner/admin can view all.
    if (role !== 'owner' && role !== 'admin') {
      orderQuery = orderQuery.in('inspector_id', inspectorIds);
    }

    const { data: order, error: orderError } = await orderQuery.limit(1).maybeSingle();
    if (orderError || !order) {
      return applyCorsHeaders(badRequest('Order not found'), request);
    }

    let template = null;
    if (order.template_id) {
      const { data: templateRow } = await supabase
        .from('templates')
        .select('id, name, description')
        .eq('id', order.template_id)
        .eq('tenant_id', tenant.id)
        .maybeSingle();

      if (templateRow) {
        const { data: sections } = await supabase
          .from('template_sections')
          .select('id, name, description, sort_order')
          .eq('template_id', templateRow.id)
          .order('sort_order');

        const sectionsWithItems = await Promise.all(
          (sections ?? []).map(async (section) => {
            const { data: items } = await supabase
              .from('template_items')
              .select('id, name, description, item_type, options, is_required, sort_order')
              .eq('section_id', section.id)
              .order('sort_order');
            return { ...section, items: items ?? [] };
          })
        );

        template = {
          ...templateRow,
          sections: sectionsWithItems,
        };
      }
    }

    const [answersRes, findingsRes, signaturesRes, mediaRes] = await Promise.all([
      supabase.from('answers').select('*').eq('order_id', order.id).eq('tenant_id', tenant.id).order('created_at'),
      supabase.from('findings').select('*').eq('order_id', order.id).eq('tenant_id', tenant.id).order('created_at'),
      supabase.from('signatures').select('*').eq('order_id', order.id).eq('tenant_id', tenant.id).order('signed_at'),
      supabase.from('media_assets').select('*').eq('order_id', order.id).eq('tenant_id', tenant.id).order('created_at'),
    ]);

    return applyCorsHeaders(
      Response.json({
        success: true,
        data: {
          order,
          template,
          answers: answersRes.data ?? [],
          findings: findingsRes.data ?? [],
          signatures: signaturesRes.data ?? [],
          media: mediaRes.data ?? [],
        },
      }),
      request
    );
  } catch (error) {
    console.error('[Mobile Order Detail] Error:', error);
    return applyCorsHeaders(serverError('Failed to load order detail'), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return buildCorsPreflightResponse(request, 'GET, OPTIONS');
}
