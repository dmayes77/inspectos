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

type MembershipRow = {
  role: string;
  profiles: { id?: string; is_inspector?: boolean } | { id?: string; is_inspector?: boolean }[] | null;
};

type FieldIntakeReason = 'emergency' | 'walk_up' | 'add_on' | 'after_hours' | 'other';
type FieldIntakePriority = 'low' | 'normal' | 'high' | 'urgent';

type FieldIntakeRequest = {
  address_line1: string;
  city: string;
  state: string;
  zip_code: string;
  reason_code: FieldIntakeReason;
  priority: FieldIntakePriority;
  contact_name?: string;
  tenant_phone?: string;
  notes?: string;
};

function normalizeProfile(row: MembershipRow): { id?: string; is_inspector?: boolean } | null {
  const profile = row.profiles;
  if (Array.isArray(profile)) return profile[0] ?? null;
  return profile ?? null;
}

function parseBody(value: unknown): FieldIntakeRequest | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<FieldIntakeRequest>;

  const reasons: FieldIntakeReason[] = ['emergency', 'walk_up', 'add_on', 'after_hours', 'other'];
  const priorities: FieldIntakePriority[] = ['low', 'normal', 'high', 'urgent'];
  if (
    typeof raw.address_line1 !== 'string' ||
    typeof raw.city !== 'string' ||
    typeof raw.state !== 'string' ||
    typeof raw.zip_code !== 'string' ||
    typeof raw.reason_code !== 'string' ||
    typeof raw.priority !== 'string' ||
    !reasons.includes(raw.reason_code as FieldIntakeReason) ||
    !priorities.includes(raw.priority as FieldIntakePriority)
  ) {
    return null;
  }

  const address_line1 = raw.address_line1.trim();
  const city = raw.city.trim();
  const state = raw.state.trim().toUpperCase();
  const zip_code = raw.zip_code.trim();
  if (!address_line1 || !city || !state || !zip_code) return null;

  return {
    address_line1,
    city,
    state,
    zip_code,
    reason_code: raw.reason_code as FieldIntakeReason,
    priority: raw.priority as FieldIntakePriority,
    contact_name: typeof raw.contact_name === 'string' ? raw.contact_name.trim() : undefined,
    tenant_phone: typeof raw.tenant_phone === 'string' ? raw.tenant_phone.trim() : undefined,
    notes: typeof raw.notes === 'string' ? raw.notes.trim() : undefined,
  };
}

export async function POST(request: NextRequest) {
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

    const rawBody = await request.json().catch(() => null);
    const body = parseBody(rawBody);
    if (!body) {
      return applyCorsHeaders(badRequest('Invalid field intake payload'), request);
    }

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

    const { data: existingProperty } = await supabase
      .from('properties')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('address_line1', body.address_line1)
      .eq('city', body.city)
      .eq('state', body.state)
      .eq('zip_code', body.zip_code)
      .maybeSingle();

    let propertyId = existingProperty?.id ?? null;
    if (!propertyId) {
      const { data: insertedProperty, error: propertyInsertError } = await supabase
        .from('properties')
        .insert({
          tenant_id: tenant.id,
          address_line1: body.address_line1,
          city: body.city,
          state: body.state,
          zip_code: body.zip_code,
          property_type: 'single-family',
        })
        .select('id')
        .single();

      if (propertyInsertError || !insertedProperty) {
        return applyCorsHeaders(serverError('Failed to create field-intake property', propertyInsertError), request);
      }
      propertyId = insertedProperty.id;
    }

    const contactName = body.contact_name || 'Field Intake Contact';
    const { data: client, error: clientInsertError } = await supabase
      .from('clients')
      .insert({
        tenant_id: tenant.id,
        name: contactName,
        phone: body.tenant_phone ?? null,
      })
      .select('id')
      .single();

    if (clientInsertError || !client) {
      return applyCorsHeaders(serverError('Failed to create field-intake client', clientInsertError), request);
    }

    const now = new Date();
    const scheduledDate = now.toISOString().split('T')[0];
    const scheduledTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const noteParts = [
      `[MOBILE_FIELD_INTAKE]`,
      `Reason: ${body.reason_code}`,
      `Priority: ${body.priority}`,
      `Created by inspector: ${user.userId}`,
      body.notes ? `Notes: ${body.notes}` : null,
    ].filter(Boolean);

    const { data: order, error: orderInsertError } = await supabase
      .from('orders')
      .insert({
        tenant_id: tenant.id,
        property_id: propertyId,
        client_id: client.id,
        inspector_id: user.userId,
        status: 'pending',
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        duration_minutes: 120,
        subtotal: 0,
        total: 0,
        source: `mobile_field_intake:${body.reason_code}`,
        internal_notes: noteParts.join('\n'),
        client_notes: body.notes ?? null,
        primary_contact_type: 'client',
        labor_cost: 0,
        travel_cost: 0,
        overhead_cost: 0,
        other_cost: 0,
      })
      .select('id, order_number, status, scheduled_date, scheduled_time')
      .single();

    if (orderInsertError || !order) {
      return applyCorsHeaders(serverError('Failed to create field intake', orderInsertError), request);
    }

    const { data: schedule } = await supabase
      .from('order_schedules')
      .insert({
        tenant_id: tenant.id,
        order_id: order.id,
        schedule_type: 'other',
        label: 'Field Intake',
        inspector_id: user.userId,
        slot_date: scheduledDate,
        slot_start: scheduledTime,
        duration_minutes: 120,
        status: 'pending',
        notes: noteParts.join('\n'),
      })
      .select('id')
      .maybeSingle();

    return applyCorsHeaders(
      Response.json({
        success: true,
        data: {
          order_id: order.id,
          order_number: order.order_number,
          status: order.status,
          scheduled_date: order.scheduled_date,
          scheduled_time: order.scheduled_time,
          schedule_id: schedule?.id ?? null,
          requires_dispatch_review: true,
          created_offline: false,
        },
      }),
      request
    );
  } catch (error) {
    console.error('[Mobile field intake] Error:', error);
    return applyCorsHeaders(serverError('Failed to create field intake'), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return buildCorsPreflightResponse(request, 'POST, OPTIONS');
}
