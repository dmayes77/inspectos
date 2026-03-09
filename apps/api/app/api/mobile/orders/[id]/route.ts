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
          sections: sectionsWithItems.map((section) => ({
            ...section,
            is_custom: false,
            items: (section.items ?? []).map((item) => ({
              ...item,
              is_custom: false,
            })),
          })),
        };
      }
    }

    const [customSectionsRes, customItemsRes, customAnswersRes] = await Promise.all([
      supabase
        .from('mobile_inspection_custom_sections')
        .select('id, name, sort_order, created_at')
        .eq('tenant_id', tenant.id)
        .eq('order_id', order.id)
        .order('sort_order')
        .order('created_at'),
      supabase
        .from('mobile_inspection_custom_items')
        .select('id, section_id, name, description, item_type, options, is_required, sort_order, created_at')
        .eq('tenant_id', tenant.id)
        .eq('order_id', order.id)
        .order('sort_order')
        .order('created_at'),
      supabase
        .from('mobile_inspection_custom_answers')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('order_id', order.id)
        .order('updated_at', { ascending: false }),
    ]);

    const customSectionItems = (customItemsRes.data ?? []).reduce<
      Record<
        string,
        Array<{
          id: unknown;
          name: unknown;
          description: unknown;
          item_type: unknown;
          options: unknown;
          is_required: unknown;
          sort_order: unknown;
          is_custom: boolean;
        }>
      >
    >((acc, item) => {
      const sectionId = String((item as { section_id?: string }).section_id ?? '');
      if (!sectionId) return acc;
      if (!acc[sectionId]) acc[sectionId] = [];
      acc[sectionId].push({
        ...item,
        is_custom: true,
      });
      return acc;
    }, {});

    const customSections = (customSectionsRes.data ?? []).map((section) => ({
      ...section,
      description: null,
      is_custom: true,
      items: customSectionItems[String((section as { id?: string }).id ?? '')] ?? [],
    }));

    if (template) {
      const mergedSections = [...(template.sections ?? [])];
      const templateIndexByName = new Map<string, number>();

      for (let index = 0; index < mergedSections.length; index += 1) {
        const key = String((mergedSections[index] as { name?: string }).name ?? '')
          .trim()
          .toLowerCase();
        if (!key || templateIndexByName.has(key)) continue;
        templateIndexByName.set(key, index);
      }

      for (const customSection of customSections) {
        const customNameKey = String((customSection as { name?: string }).name ?? '')
          .trim()
          .toLowerCase();
        const targetIndex = customNameKey ? templateIndexByName.get(customNameKey) : undefined;

        if (targetIndex == null) {
          mergedSections.push(customSection as (typeof mergedSections)[number]);
          continue;
        }

        const targetSection = mergedSections[targetIndex] as { items?: Array<Record<string, unknown>> };
        const customItems = ((customSection as { items?: Array<Record<string, unknown>> }).items ?? []).map((item) => ({
          ...item,
          is_custom: true,
        }));
        targetSection.items = [...(targetSection.items ?? []), ...customItems];
      }

      template = {
        ...template,
        sections: mergedSections,
      };
    } else if (customSections.length > 0) {
      template = {
        id: `custom-${order.id}`,
        name: 'Custom Inspection',
        description: 'Inspector-created sections and items',
        sections: customSections,
      };
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
          custom_answers: customAnswersRes.data ?? [],
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
