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

type TenantRow = {
  id: string;
  slug: string;
  business_id?: string | null;
};

type CreateOutlinePayload =
  | {
      type: 'section';
      name: string;
    }
  | {
      type: 'item';
      section_id: string;
      name: string;
      description?: string | null;
      item_type?: string | null;
      is_required?: boolean;
    };

function normalizeProfile(row: MembershipRow): { id?: string; is_inspector?: boolean } | null {
  const profile = row.profiles;
  if (Array.isArray(profile)) return profile[0] ?? null;
  return profile ?? null;
}

async function resolveTenantForBusiness(
  supabase: ReturnType<typeof createUserClient>,
  businessIdentifier: string
): Promise<TenantRow | null> {
  const { data: tenantBySlug, error: tenantSlugError } = await supabase
    .from('tenants')
    .select('id, slug, business_id')
    .eq('slug', businessIdentifier)
    .maybeSingle();

  const tenantByBusinessId = !tenantBySlug
    ? await supabase
        .from('tenants')
        .select('id, slug, business_id')
        .eq('business_id', businessIdentifier.toUpperCase())
        .maybeSingle()
    : { data: null, error: null };

  const tenant = (tenantBySlug ?? tenantByBusinessId.data) as TenantRow | null;
  const tenantError = tenantBySlug ? tenantSlugError : tenantByBusinessId.error;
  if (tenantError || !tenant) return null;
  return tenant;
}

async function verifyInspectorMembership(
  supabase: ReturnType<typeof createUserClient>,
  tenantId: string,
  userId: string
): Promise<boolean> {
  const { data: membershipRaw, error: membershipError } = await supabase
    .from('tenant_members')
    .select('role, profiles!left(id, is_inspector)')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single();

  if (membershipError || !membershipRaw) return false;
  const membership = membershipRaw as MembershipRow;
  const profile = normalizeProfile(membership);
  return (
    membership.role === 'owner' ||
    membership.role === 'admin' ||
    membership.role === 'inspector' ||
    Boolean(profile?.is_inspector)
  );
}

async function resolveOrderId(
  supabase: ReturnType<typeof createUserClient>,
  tenantId: string,
  rawId: string
): Promise<string | null> {
  const lookup = resolveIdLookup(rawId, {
    publicColumn: 'order_number',
    transformPublicValue: (value) => value.toUpperCase(),
  });

  const { data: orderRow, error: orderError } = await supabase
    .from('orders')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq(lookup.column, lookup.value)
    .maybeSingle();

  if (orderError || !orderRow) return null;
  return orderRow.id as string;
}

function parsePayload(body: unknown): CreateOutlinePayload | null {
  if (!body || typeof body !== 'object') return null;
  const row = body as Record<string, unknown>;
  const type = typeof row.type === 'string' ? row.type : '';
  if (type === 'section') {
    const name = typeof row.name === 'string' ? row.name.trim() : '';
    if (!name) return null;
    return { type, name };
  }
  if (type === 'item') {
    const sectionId = typeof row.section_id === 'string' ? row.section_id.trim() : '';
    const name = typeof row.name === 'string' ? row.name.trim() : '';
    if (!sectionId || !name) return null;
    return {
      type,
      section_id: sectionId,
      name,
      description: typeof row.description === 'string' ? row.description : null,
      item_type: typeof row.item_type === 'string' ? row.item_type : null,
      is_required: Boolean(row.is_required),
    };
  }
  return null;
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) return applyCorsHeaders(unauthorized('Missing access token'), request);

    const user = getUserFromToken(accessToken);
    if (!user) return applyCorsHeaders(unauthorized('Invalid access token'), request);

    const businessIdentifier = request.nextUrl.searchParams.get('business');
    if (!businessIdentifier) return applyCorsHeaders(badRequest('Missing business parameter'), request);

    const { id } = await context.params;
    if (!id) return applyCorsHeaders(badRequest('Order id is required'), request);

    const payload = parsePayload(await request.json().catch(() => null));
    if (!payload) return applyCorsHeaders(badRequest('Invalid inspection outline payload'), request);

    const supabase = createUserClient(accessToken);
    const tenant = await resolveTenantForBusiness(supabase, businessIdentifier);
    if (!tenant) return applyCorsHeaders(badRequest('Business not found'), request);

    const hasInspectorAccess = await verifyInspectorMembership(supabase, tenant.id, user.userId);
    if (!hasInspectorAccess) {
      return applyCorsHeaders(unauthorized('Inspector mobile access is restricted to inspector seats.'), request);
    }

    const orderId = await resolveOrderId(supabase, tenant.id, id);
    if (!orderId) return applyCorsHeaders(badRequest('Order not found'), request);

    if (payload.type === 'section') {
      const { data, error } = await supabase
        .from('mobile_inspection_custom_sections')
        .insert({
          tenant_id: tenant.id,
          order_id: orderId,
          name: payload.name,
          created_by: user.userId,
        })
        .select('id, name, sort_order, created_at')
        .single();

      if (error || !data) return applyCorsHeaders(serverError('Failed to create custom section', error), request);

      return applyCorsHeaders(Response.json({ success: true, data: { section: data } }), request);
    }

    const { data: sectionRow, error: sectionError } = await supabase
      .from('mobile_inspection_custom_sections')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('order_id', orderId)
      .eq('id', payload.section_id)
      .maybeSingle();

    let resolvedCustomSectionId = sectionRow?.id as string | undefined;

    if (sectionError) {
      return applyCorsHeaders(serverError('Failed to resolve section', sectionError), request);
    }

    if (!resolvedCustomSectionId) {
      const { data: orderRow } = await supabase
        .from('orders')
        .select('template_id')
        .eq('tenant_id', tenant.id)
        .eq('id', orderId)
        .maybeSingle();

      if (!orderRow?.template_id) {
        return applyCorsHeaders(badRequest('Custom section not found'), request);
      }

      const { data: templateSection } = await supabase
        .from('template_sections')
        .select('id, name')
        .eq('id', payload.section_id)
        .eq('template_id', orderRow.template_id)
        .maybeSingle();

      if (!templateSection?.name) {
        return applyCorsHeaders(badRequest('Custom section not found'), request);
      }

      const { data: existingCustomSection } = await supabase
        .from('mobile_inspection_custom_sections')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('order_id', orderId)
        .eq('name', templateSection.name)
        .order('created_at')
        .limit(1)
        .maybeSingle();

      if (existingCustomSection?.id) {
        resolvedCustomSectionId = existingCustomSection.id as string;
      } else {
        const { data: insertedSection, error: insertedSectionError } = await supabase
          .from('mobile_inspection_custom_sections')
          .insert({
            tenant_id: tenant.id,
            order_id: orderId,
            name: templateSection.name,
            created_by: user.userId,
          })
          .select('id')
          .single();

        if (insertedSectionError || !insertedSection?.id) {
          return applyCorsHeaders(serverError('Failed to create matching custom section', insertedSectionError), request);
        }

        resolvedCustomSectionId = insertedSection.id as string;
      }
    }

    const { data, error } = await supabase
      .from('mobile_inspection_custom_items')
      .insert({
        tenant_id: tenant.id,
        order_id: orderId,
        section_id: resolvedCustomSectionId,
        name: payload.name,
        description: payload.description ?? null,
        item_type: payload.item_type || 'text',
        is_required: Boolean(payload.is_required),
        created_by: user.userId,
      })
      .select('id, section_id, name, description, item_type, options, is_required, sort_order, created_at')
      .single();

    if (error || !data) return applyCorsHeaders(serverError('Failed to create custom item', error), request);

    return applyCorsHeaders(Response.json({ success: true, data: { item: data } }), request);
  } catch (error) {
    return applyCorsHeaders(serverError('Failed to update inspection outline', error), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return buildCorsPreflightResponse(request, 'POST, OPTIONS');
}
