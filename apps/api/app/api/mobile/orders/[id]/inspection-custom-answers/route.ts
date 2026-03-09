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

type CustomAnswerInput = {
  custom_item_id: string;
  value?: string | null;
  notes?: string | null;
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

function parsePayload(body: unknown): CustomAnswerInput[] | null {
  if (!body || typeof body !== 'object') return null;
  const answers = (body as { answers?: unknown }).answers;
  if (!Array.isArray(answers)) return null;

  const parsed: CustomAnswerInput[] = [];
  for (const answer of answers) {
    if (!answer || typeof answer !== 'object') return null;
    const row = answer as Record<string, unknown>;
    if (typeof row.custom_item_id !== 'string') return null;

    parsed.push({
      custom_item_id: row.custom_item_id,
      value: typeof row.value === 'string' ? row.value : row.value == null ? null : String(row.value),
      notes: typeof row.notes === 'string' ? row.notes : row.notes == null ? null : String(row.notes),
    });
  }
  return parsed;
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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
    if (!payload) return applyCorsHeaders(badRequest('Invalid custom answers payload'), request);

    const supabase = createUserClient(accessToken);
    const tenant = await resolveTenantForBusiness(supabase, businessIdentifier);
    if (!tenant) return applyCorsHeaders(badRequest('Business not found'), request);

    const hasInspectorAccess = await verifyInspectorMembership(supabase, tenant.id, user.userId);
    if (!hasInspectorAccess) {
      return applyCorsHeaders(unauthorized('Inspector mobile access is restricted to inspector seats.'), request);
    }

    const orderId = await resolveOrderId(supabase, tenant.id, id);
    if (!orderId) return applyCorsHeaders(badRequest('Order not found'), request);

    const now = new Date().toISOString();
    for (const answer of payload) {
      const trimmedValue = answer.value?.trim() ?? '';
      const trimmedNotes = answer.notes?.trim() ?? '';
      const shouldClear = trimmedValue.length === 0 && trimmedNotes.length === 0;

      const { data: itemRow } = await supabase
        .from('mobile_inspection_custom_items')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('order_id', orderId)
        .eq('id', answer.custom_item_id)
        .maybeSingle();
      if (!itemRow) {
        return applyCorsHeaders(badRequest('Custom item not found for answer payload'), request);
      }

      const { data: existingRow } = await supabase
        .from('mobile_inspection_custom_answers')
        .select('id, created_by')
        .eq('tenant_id', tenant.id)
        .eq('order_id', orderId)
        .eq('custom_item_id', answer.custom_item_id)
        .maybeSingle();

      if (existingRow?.id && shouldClear) {
        const { error } = await supabase.from('mobile_inspection_custom_answers').delete().eq('id', existingRow.id);
        if (error) return applyCorsHeaders(serverError('Failed to clear custom answer', error), request);
        continue;
      }

      if (existingRow?.id) {
        const { error } = await supabase
          .from('mobile_inspection_custom_answers')
          .update({
            value: trimmedValue.length > 0 ? trimmedValue : null,
            notes: trimmedNotes.length > 0 ? trimmedNotes : null,
            updated_by: user.userId,
            updated_at: now,
          })
          .eq('id', existingRow.id);
        if (error) return applyCorsHeaders(serverError('Failed to update custom answer', error), request);
        continue;
      }

      if (shouldClear) continue;

      const { error } = await supabase.from('mobile_inspection_custom_answers').insert({
        tenant_id: tenant.id,
        order_id: orderId,
        custom_item_id: answer.custom_item_id,
        value: trimmedValue.length > 0 ? trimmedValue : null,
        notes: trimmedNotes.length > 0 ? trimmedNotes : null,
        created_by: user.userId,
        updated_by: user.userId,
        created_at: now,
        updated_at: now,
      });
      if (error) return applyCorsHeaders(serverError('Failed to create custom answer', error), request);
    }

    const { data, error } = await supabase
      .from('mobile_inspection_custom_answers')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('order_id', orderId)
      .order('updated_at', { ascending: false });
    if (error) return applyCorsHeaders(serverError('Failed to reload custom answers', error), request);

    return applyCorsHeaders(Response.json({ success: true, data: { items: data ?? [] } }), request);
  } catch (error) {
    return applyCorsHeaders(serverError('Failed to save custom inspection answers', error), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return buildCorsPreflightResponse(request, 'PUT, OPTIONS');
}

