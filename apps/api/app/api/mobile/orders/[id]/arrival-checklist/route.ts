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
  name: string;
  slug: string;
  business_id?: string | null;
};

type ArrivalChecklistRow = {
  checklist: Record<string, unknown>;
  updated_at: string;
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

  const tenant = (tenantBySlug ?? tenantByBusinessId.data) as TenantRow | null;
  const tenantError = tenantBySlug ? tenantSlugError : tenantByBusinessId.error;
  if (tenantError || !tenant) {
    return null;
  }

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

    const businessIdentifier = request.nextUrl.searchParams.get('business');
    if (!businessIdentifier) {
      return applyCorsHeaders(badRequest('Missing business parameter'), request);
    }

    const { id } = await context.params;
    if (!id) {
      return applyCorsHeaders(badRequest('Order id is required'), request);
    }

    const supabase = createUserClient(accessToken);

    const tenant = await resolveTenantForBusiness(supabase, businessIdentifier);
    if (!tenant) {
      return applyCorsHeaders(badRequest('Business not found'), request);
    }

    const hasInspectorAccess = await verifyInspectorMembership(supabase, tenant.id, user.userId);
    if (!hasInspectorAccess) {
      return applyCorsHeaders(unauthorized('Inspector mobile access is restricted to inspector seats.'), request);
    }

    const orderId = await resolveOrderId(supabase, tenant.id, id);
    if (!orderId) {
      return applyCorsHeaders(badRequest('Order not found'), request);
    }

    const { data, error } = await supabase
      .from('mobile_arrival_checklists')
      .select('checklist, updated_at')
      .eq('tenant_id', tenant.id)
      .eq('order_id', orderId)
      .eq('user_id', user.userId)
      .maybeSingle();

    if (error) {
      return applyCorsHeaders(serverError('Failed to load arrival checklist', error), request);
    }

    const item = data as ArrivalChecklistRow | null;

    return applyCorsHeaders(
      Response.json({
        success: true,
        data: {
          item: item
            ? {
                checklist: item.checklist,
                updated_at: item.updated_at,
              }
            : null,
        },
      }),
      request
    );
  } catch (error) {
    return applyCorsHeaders(serverError('Failed to load arrival checklist', error), request);
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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

    const { id } = await context.params;
    if (!id) {
      return applyCorsHeaders(badRequest('Order id is required'), request);
    }

    const body = (await request.json().catch(() => null)) as { checklist?: Record<string, unknown> } | null;
    if (!body || !body.checklist || typeof body.checklist !== 'object') {
      return applyCorsHeaders(badRequest('Invalid arrival checklist payload'), request);
    }

    const supabase = createUserClient(accessToken);

    const tenant = await resolveTenantForBusiness(supabase, businessIdentifier);
    if (!tenant) {
      return applyCorsHeaders(badRequest('Business not found'), request);
    }

    const hasInspectorAccess = await verifyInspectorMembership(supabase, tenant.id, user.userId);
    if (!hasInspectorAccess) {
      return applyCorsHeaders(unauthorized('Inspector mobile access is restricted to inspector seats.'), request);
    }

    const orderId = await resolveOrderId(supabase, tenant.id, id);
    if (!orderId) {
      return applyCorsHeaders(badRequest('Order not found'), request);
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('mobile_arrival_checklists')
      .upsert(
        {
          tenant_id: tenant.id,
          order_id: orderId,
          user_id: user.userId,
          checklist: body.checklist,
          updated_at: now,
        },
        {
          onConflict: 'tenant_id,order_id,user_id',
        }
      )
      .select('checklist, updated_at')
      .single();

    if (error || !data) {
      return applyCorsHeaders(serverError('Failed to save arrival checklist', error), request);
    }

    const item = data as ArrivalChecklistRow;

    return applyCorsHeaders(
      Response.json({
        success: true,
        data: {
          item: {
            checklist: item.checklist,
            updated_at: item.updated_at,
          },
        },
      }),
      request
    );
  } catch (error) {
    return applyCorsHeaders(serverError('Failed to save arrival checklist', error), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return buildCorsPreflightResponse(request, 'GET, PUT, OPTIONS');
}
