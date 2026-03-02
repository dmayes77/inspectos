import type { NextRequest } from 'next/server';
import {
  INSPECTION_STATE_MACHINE_VERSION,
  INSPECTION_TRANSITION_TRIGGERS,
  INSPECTION_WORKFLOW_STATES,
  findInspectionTransitionRule,
  type InspectionTransitionRequestPayload,
  type InspectionTransitionResponsePayload,
  type InspectionTransitionTrigger,
  type InspectionWorkflowState,
} from '../../../../../../../../shared/types/inspection-state-machine';
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

function isWorkflowState(value: unknown): value is InspectionWorkflowState {
  return typeof value === 'string' && INSPECTION_WORKFLOW_STATES.includes(value as InspectionWorkflowState);
}

function isTransitionTrigger(value: unknown): value is InspectionTransitionTrigger {
  return typeof value === 'string' && INSPECTION_TRANSITION_TRIGGERS.includes(value as InspectionTransitionTrigger);
}

function parseTransitionRequestBody(value: unknown): InspectionTransitionRequestPayload | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<InspectionTransitionRequestPayload>;

  if (
    typeof raw.event_id !== 'string' ||
    typeof raw.event_time !== 'string' ||
    typeof raw.device_id !== 'string' ||
    raw.state_machine_version !== INSPECTION_STATE_MACHINE_VERSION ||
    !isWorkflowState(raw.from_state) ||
    !isWorkflowState(raw.to_state) ||
    !isTransitionTrigger(raw.trigger)
  ) {
    return null;
  }

  return {
    event_id: raw.event_id,
    event_time: raw.event_time,
    device_id: raw.device_id,
    state_machine_version: raw.state_machine_version,
    from_state: raw.from_state,
    to_state: raw.to_state,
    trigger: raw.trigger,
    checklist_version: typeof raw.checklist_version === 'string' ? raw.checklist_version : undefined,
    checks: raw.checks && typeof raw.checks === 'object' ? raw.checks : undefined,
    metadata: raw.metadata && typeof raw.metadata === 'object' ? raw.metadata : undefined,
  };
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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
    const lookup = resolveIdLookup(id, {
      publicColumn: 'order_number',
      transformPublicValue: (value) => value.toUpperCase(),
    });

    const rawBody = await request.json().catch(() => null);
    const body = parseTransitionRequestBody(rawBody);
    if (!body) {
      return applyCorsHeaders(badRequest('Invalid transition payload'), request);
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

    const inspectorIds = [user.userId];
    if (profile?.id && profile.id !== user.userId) {
      inspectorIds.push(profile.id);
    }

    let orderQuery = supabase
      .from('orders')
      .select('id, status, inspector_id, source')
      .eq(lookup.column, lookup.value)
      .eq('tenant_id', tenant.id);

    if (role !== 'owner' && role !== 'admin') {
      orderQuery = orderQuery.in('inspector_id', inspectorIds);
    }

    const { data: order, error: orderError } = await orderQuery.limit(1).maybeSingle();
    if (orderError || !order) {
      return applyCorsHeaders(badRequest('Order not found'), request);
    }

    const isLockedFieldIntake =
      typeof order.source === 'string' &&
      order.source.startsWith('mobile_field_intake:') &&
      order.status === 'pending';

    if (isLockedFieldIntake) {
      return applyCorsHeaders(
        Response.json(
          {
            success: false,
            error: {
              code: 'FIELD_INTAKE_PENDING_DISPATCH',
              message: 'Field Intake must be deployed by dispatch before inspection can continue.',
            },
          },
          { status: 409 }
        ),
        request
      );
    }

    const transitionRule = findInspectionTransitionRule(
      body.from_state,
      body.to_state,
      body.trigger
    );

    if (!transitionRule) {
      return applyCorsHeaders(
        badRequest(`Transition not allowed: ${body.from_state} -> ${body.to_state} (${body.trigger})`),
        request
      );
    }

    const missingChecks = transitionRule.required_checks.filter((check) => !body.checks?.[check]);
    if (missingChecks.length > 0) {
      return applyCorsHeaders(
        Response.json(
          {
            success: false,
            error: {
              code: 'TRANSITION_CHECKS_FAILED',
              message: 'One or more required transition checks are missing',
              missing_checks: missingChecks,
            },
          },
          { status: 409 }
        ),
        request
      );
    }

    const result: InspectionTransitionResponsePayload = {
      accepted: true,
      order_id: order.id,
      event_id: body.event_id,
      accepted_at: new Date().toISOString(),
      state_machine_version: INSPECTION_STATE_MACHINE_VERSION,
      from_state: body.from_state,
      to_state: body.to_state,
      trigger: body.trigger,
      missing_checks: [],
    };

    return applyCorsHeaders(
      Response.json({
        success: true,
        data: result,
      }),
      request
    );
  } catch (error) {
    console.error('[Mobile Order Transition] Error:', error);
    return applyCorsHeaders(serverError('Failed to process order transition'), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return buildCorsPreflightResponse(request, 'POST, OPTIONS');
}
