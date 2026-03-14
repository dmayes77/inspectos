import type { NextRequest } from 'next/server';
import {
  hasInspectorSeatAccess,
  resolveInspectorMembership,
  resolveOrderIdForTenantLookup,
  resolveTenantForBusinessIdentifier,
} from '@inspectos/platform/mobile-orders-access';
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

    const tenant = await resolveTenantForBusinessIdentifier<TenantRow>(
      supabase,
      businessIdentifier,
      'id, name, slug, business_id'
    );
    if (!tenant) {
      return applyCorsHeaders(badRequest('Business not found'), request);
    }

    const membership = await resolveInspectorMembership(supabase, tenant.id, user.userId);
    const hasInspectorAccess = membership
      ? hasInspectorSeatAccess(membership.role, membership.isInspectorFlag)
      : false;
    if (!hasInspectorAccess) {
      return applyCorsHeaders(unauthorized('Inspector mobile access is restricted to inspector seats.'), request);
    }

    const lookup = resolveIdLookup(id, {
      publicColumn: 'order_number',
      transformPublicValue: (value) => value.toUpperCase(),
    });
    const orderId = await resolveOrderIdForTenantLookup(supabase, tenant.id, lookup);
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

    const tenant = await resolveTenantForBusinessIdentifier<TenantRow>(
      supabase,
      businessIdentifier,
      'id, name, slug, business_id'
    );
    if (!tenant) {
      return applyCorsHeaders(badRequest('Business not found'), request);
    }

    const membership = await resolveInspectorMembership(supabase, tenant.id, user.userId);
    const hasInspectorAccess = membership
      ? hasInspectorSeatAccess(membership.role, membership.isInspectorFlag)
      : false;
    if (!hasInspectorAccess) {
      return applyCorsHeaders(unauthorized('Inspector mobile access is restricted to inspector seats.'), request);
    }

    const lookup = resolveIdLookup(id, {
      publicColumn: 'order_number',
      transformPublicValue: (value) => value.toUpperCase(),
    });
    const orderId = await resolveOrderIdForTenantLookup(supabase, tenant.id, lookup);
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
