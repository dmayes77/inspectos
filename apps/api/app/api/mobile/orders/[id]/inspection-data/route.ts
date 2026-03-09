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

type InspectionAnswerInput = {
  template_item_id: string;
  section_id: string;
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

function parsePayload(body: unknown): InspectionAnswerInput[] | null {
  if (!body || typeof body !== 'object') return null;
  const answers = (body as { answers?: unknown }).answers;
  if (!Array.isArray(answers)) return null;

  const parsed: InspectionAnswerInput[] = [];
  for (const answer of answers) {
    if (!answer || typeof answer !== 'object') return null;
    const row = answer as Record<string, unknown>;
    if (typeof row.template_item_id !== 'string' || typeof row.section_id !== 'string') {
      return null;
    }

    parsed.push({
      template_item_id: row.template_item_id,
      section_id: row.section_id,
      value: typeof row.value === 'string' ? row.value : row.value == null ? null : String(row.value),
      notes: typeof row.notes === 'string' ? row.notes : row.notes == null ? null : String(row.notes),
    });
  }

  return parsed;
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
      .from('answers')
      .select('*')
      .eq('order_id', orderId)
      .order('updated_at', { ascending: false });

    if (error) {
      return applyCorsHeaders(serverError('Failed to load inspection answers', error), request);
    }

    return applyCorsHeaders(
      Response.json({
        success: true,
        data: {
          items: data ?? [],
        },
      }),
      request
    );
  } catch (error) {
    return applyCorsHeaders(serverError('Failed to load inspection answers', error), request);
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

    const body = await request.json().catch(() => null);
    const answers = parsePayload(body);
    if (!answers) {
      return applyCorsHeaders(badRequest('Invalid inspection answers payload'), request);
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

    const { data: existingRows, error: existingError } = await supabase
      .from('answers')
      .select('id, template_item_id')
      .eq('order_id', orderId);

    if (existingError) {
      return applyCorsHeaders(serverError('Failed to load existing answers', existingError), request);
    }

    const existingByItemId = new Map<string, string>();
    for (const row of existingRows ?? []) {
      const templateItemId = (row as { template_item_id?: string }).template_item_id;
      const rowId = (row as { id?: string }).id;
      if (templateItemId && rowId) {
        existingByItemId.set(templateItemId, rowId);
      }
    }

    const now = new Date().toISOString();
    for (const answer of answers) {
      const normalizedValue = answer.value?.trim() ?? '';
      const normalizedNotes = answer.notes?.trim() ?? '';
      const shouldClear = normalizedValue.length === 0 && normalizedNotes.length === 0;
      const existingId = existingByItemId.get(answer.template_item_id);

      if (existingId && shouldClear) {
        const { error } = await supabase.from('answers').delete().eq('id', existingId);
        if (error) {
          return applyCorsHeaders(serverError('Failed to clear answer', error), request);
        }
        continue;
      }

      if (existingId) {
        const { error } = await supabase
          .from('answers')
          .update({
            section_id: answer.section_id,
            value: normalizedValue.length > 0 ? normalizedValue : null,
            notes: normalizedNotes.length > 0 ? normalizedNotes : null,
            updated_at: now,
          })
          .eq('id', existingId);

        if (error) {
          return applyCorsHeaders(serverError('Failed to update answer', error), request);
        }
        continue;
      }

      if (shouldClear) {
        continue;
      }

      const rowWithTenant = {
        tenant_id: tenant.id,
        order_id: orderId,
        template_item_id: answer.template_item_id,
        section_id: answer.section_id,
        value: normalizedValue.length > 0 ? normalizedValue : null,
        notes: normalizedNotes.length > 0 ? normalizedNotes : null,
        created_at: now,
        updated_at: now,
      };

      let insertError =
        (
          await supabase
            .from('answers')
            .insert(rowWithTenant)
        ).error ?? null;

      if (
        insertError &&
        insertError.message.toLowerCase().includes('tenant_id') &&
        insertError.message.toLowerCase().includes('column')
      ) {
        insertError =
          (
            await supabase
              .from('answers')
              .insert({
                order_id: orderId,
                template_item_id: answer.template_item_id,
                section_id: answer.section_id,
                value: normalizedValue.length > 0 ? normalizedValue : null,
                notes: normalizedNotes.length > 0 ? normalizedNotes : null,
                created_at: now,
                updated_at: now,
              })
          ).error ?? null;
      }

      if (insertError) {
        return applyCorsHeaders(serverError('Failed to create answer', insertError), request);
      }
    }

    const { data, error } = await supabase
      .from('answers')
      .select('*')
      .eq('order_id', orderId)
      .order('updated_at', { ascending: false });

    if (error) {
      return applyCorsHeaders(serverError('Failed to reload answers', error), request);
    }

    return applyCorsHeaders(
      Response.json({
        success: true,
        data: {
          items: data ?? [],
        },
      }),
      request
    );
  } catch (error) {
    return applyCorsHeaders(serverError('Failed to save inspection answers', error), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return buildCorsPreflightResponse(request, 'GET, PUT, OPTIONS');
}
