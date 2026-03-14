import type { NextRequest } from 'next/server';
import {
  parseTransitionRequestBody,
  validateInspectionTransitionRequest,
} from '@inspectos/domains/orders';
import {
  buildInspectorScopeUserIds,
  hasInspectorSeatAccess,
  resolveInspectorMembership,
  resolveOrderForTenantLookup,
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
import { deriveInspectionWorkflowState } from '@/lib/order-workflow';

type CountQueryResult = {
  count: number | null;
  error: { message?: string | null } | null;
};

function isMissingRelationError(error: { message?: string | null } | null | undefined): boolean {
  const message = error?.message?.toLowerCase() ?? '';
  return (
    message.includes('does not exist') ||
    message.includes('relation') ||
    message.includes('column') ||
    message.includes('schema cache') ||
    message.includes('could not find')
  );
}

function resolveCountOrFallback(result: CountQueryResult, fallback = 0): { count: number; error: { message?: string | null } | null } {
  if (!result.error) {
    return { count: result.count ?? fallback, error: null };
  }

  if (isMissingRelationError(result.error)) {
    return { count: fallback, error: null };
  }

  return { count: fallback, error: result.error };
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

    const tenant = await resolveTenantForBusinessIdentifier<{ id: string; name: string; slug: string; business_id?: string | null }>(
      supabase,
      businessIdentifier,
      'id, name, slug, business_id'
    );
    if (!tenant) {
      return applyCorsHeaders(badRequest('Business not found'), request);
    }

    const membership = await resolveInspectorMembership(supabase, tenant.id, user.userId);
    if (!membership) {
      return applyCorsHeaders(unauthorized('Not a member of this business'), request);
    }

    const hasInspectorAccess = hasInspectorSeatAccess(membership.role, membership.isInspectorFlag);
    if (!hasInspectorAccess) {
      return applyCorsHeaders(unauthorized('Inspector mobile access is restricted to inspector seats.'), request);
    }

    const inspectorIds = buildInspectorScopeUserIds(user.userId, membership.profileId);
    const scopedInspectorIds =
      membership.role === 'owner' || membership.role === 'admin' ? undefined : inspectorIds;

    const order = await resolveOrderForTenantLookup<{
      id: string;
      status: string;
      inspector_id?: string | null;
      source?: string | null;
      started_at?: string | null;
    }>(
      supabase,
      tenant.id,
      lookup,
      'id, status, inspector_id, source, started_at',
      scopedInspectorIds
    );
    if (!order) {
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

    const { data: workflowStateRow, error: workflowStateError } = await supabase
      .from('order_workflow_states')
      .select('workflow_state, current_blocker_type, current_blocker_notes, current_blocker_reported_at')
      .eq('tenant_id', tenant.id)
      .eq('order_id', order.id)
      .maybeSingle();

    if (workflowStateError) {
      return applyCorsHeaders(serverError('Failed to load workflow state', workflowStateError), request);
    }

    let hasStarted = Boolean(order.started_at);

    if (!workflowStateRow && !hasStarted) {
      const [answersCountRes, customAnswersCountRes, findingsCountRes, mediaCountRes] = await Promise.all([
        supabase.from('answers').select('*', { count: 'exact', head: true }).eq('order_id', order.id),
        supabase
          .from('mobile_inspection_custom_answers')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .eq('order_id', order.id),
        supabase.from('findings').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('order_id', order.id),
        supabase.from('media_assets').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('order_id', order.id),
      ]);

      const answersCount = resolveCountOrFallback(answersCountRes);
      const customAnswersCount = resolveCountOrFallback(customAnswersCountRes);
      const findingsCount = resolveCountOrFallback(findingsCountRes);
      const mediaCount = resolveCountOrFallback(mediaCountRes);

      if (answersCount.error) {
        return applyCorsHeaders(serverError('Failed to load answer counts', answersCount.error), request);
      }
      if (customAnswersCount.error) {
        return applyCorsHeaders(serverError('Failed to load custom answer counts', customAnswersCount.error), request);
      }
      if (findingsCount.error) {
        return applyCorsHeaders(serverError('Failed to load findings count', findingsCount.error), request);
      }
      if (mediaCount.error) {
        return applyCorsHeaders(serverError('Failed to load media count', mediaCount.error), request);
      }

      hasStarted =
        answersCount.count > 0 ||
        customAnswersCount.count > 0 ||
        findingsCount.count > 0 ||
        mediaCount.count > 0;
    }

    const persistedState = workflowStateRow?.workflow_state ?? deriveInspectionWorkflowState(order.status, hasStarted);
    if (body.from_state !== persistedState) {
      return applyCorsHeaders(
        Response.json(
          {
            success: false,
            error: {
              code: 'WORKFLOW_STATE_MISMATCH',
              message: `Workflow is currently ${persistedState}, not ${body.from_state}.`,
              current_state: persistedState,
            },
          },
          { status: 409 }
        ),
        request
      );
    }

    const effectiveChecks = {
      ...body.checks,
      inspector_membership_verified: true,
      order_assigned_to_inspector: Boolean(order.inspector_id && inspectorIds.includes(order.inspector_id)),
      active_session_exists:
        persistedState === 'in_progress' ||
        persistedState === 'paused' ||
        persistedState === 'waiting_for_info' ||
        order.status === 'in_progress',
      blocker_open:
        persistedState === 'waiting_for_info' &&
        Boolean(
          workflowStateRow?.current_blocker_type ||
          workflowStateRow?.current_blocker_notes ||
          workflowStateRow?.current_blocker_reported_at
        ),
    } satisfies Record<string, unknown>;

    const transition = validateInspectionTransitionRequest(
      {
        ...body,
        checks: effectiveChecks,
      },
      order.id
    );

    if (!transition.ok) {
      if (transition.failure.code === 'TRANSITION_NOT_ALLOWED') {
        return applyCorsHeaders(badRequest(transition.failure.message), request);
      }

      if (transition.failure.code === 'TRANSITION_CHECKS_FAILED') {
        return applyCorsHeaders(
          Response.json(
            {
              success: false,
              error: {
                code: transition.failure.code,
                message: transition.failure.message,
                missing_checks: transition.failure.missingChecks,
              },
            },
            { status: 409 }
          ),
          request
        );
      }

      return applyCorsHeaders(badRequest(transition.failure.message), request);
    }

    const actorProfileId = membership.profileId ?? null;
    const blockerType = typeof body.metadata?.blocker_type === 'string' ? body.metadata.blocker_type : null;
    const blockerNotes = typeof body.metadata?.blocker_notes === 'string' ? body.metadata.blocker_notes : null;
    const blockerResolutionNotes =
      typeof body.metadata?.blocker_resolution_notes === 'string' ? body.metadata.blocker_resolution_notes : null;

    const { error: eventWriteError } = await supabase
      .from('order_workflow_events')
      .upsert(
        {
          tenant_id: tenant.id,
          order_id: order.id,
          event_id: body.event_id,
          event_time: body.event_time,
          device_id: body.device_id,
          actor_profile_id: actorProfileId,
          from_state: body.from_state,
          to_state: body.to_state,
          trigger: body.trigger,
          checklist_version: body.checklist_version ?? null,
          checks: effectiveChecks,
          metadata: body.metadata ?? {},
        },
        { onConflict: 'tenant_id,event_id' }
      );

    if (eventWriteError) {
      return applyCorsHeaders(serverError('Failed to write workflow event', eventWriteError), request);
    }

    const nextStatePayload: Record<string, unknown> = {
      tenant_id: tenant.id,
      order_id: order.id,
      workflow_state: body.to_state,
    };

    if (body.trigger === 'BLOCKER_REPORTED') {
      nextStatePayload.current_blocker_type = blockerType;
      nextStatePayload.current_blocker_notes = blockerNotes;
      nextStatePayload.current_blocker_reported_at = body.event_time;
      nextStatePayload.current_blocker_reported_by = actorProfileId;
      nextStatePayload.current_blocker_resolution_notes = null;
      nextStatePayload.current_blocker_resolved_at = null;
      nextStatePayload.current_blocker_resolved_by = null;
    } else if (body.trigger === 'BLOCKER_CLEARED') {
      nextStatePayload.current_blocker_type = null;
      nextStatePayload.current_blocker_notes = null;
      nextStatePayload.current_blocker_reported_at = null;
      nextStatePayload.current_blocker_reported_by = null;
      nextStatePayload.current_blocker_resolution_notes = blockerResolutionNotes;
      nextStatePayload.current_blocker_resolved_at = body.event_time;
      nextStatePayload.current_blocker_resolved_by = actorProfileId;
    }

    const { error: stateWriteError } = await supabase
      .from('order_workflow_states')
      .upsert(nextStatePayload, { onConflict: 'tenant_id,order_id' });

    if (stateWriteError) {
      return applyCorsHeaders(serverError('Failed to write workflow state', stateWriteError), request);
    }

    const orderUpdate: Record<string, unknown> = {};
    if (body.to_state === 'in_progress' && order.status !== 'in_progress') {
      orderUpdate.status = 'in_progress';
    } else if (body.to_state === 'ready_for_review' && order.status === 'in_progress') {
      orderUpdate.status = 'pending_report';
    } else if (body.to_state === 'completed' && order.status !== 'completed') {
      orderUpdate.status = 'completed';
      orderUpdate.completed_at = new Date().toISOString();
    }

    if (Object.keys(orderUpdate).length > 0) {
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update(orderUpdate)
        .eq('tenant_id', tenant.id)
        .eq('id', order.id);

      if (orderUpdateError) {
        return applyCorsHeaders(serverError('Failed to update order status from workflow', orderUpdateError), request);
      }
    }

    return applyCorsHeaders(
      Response.json({
        success: true,
        data: transition.result,
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
