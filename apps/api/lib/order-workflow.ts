import type { SupabaseClient } from '@supabase/supabase-js';
import type { InspectionWorkflowState } from '../../../shared/types/inspection-state-machine';

type ProfileSummary = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type WorkflowStateRow = {
  workflow_state: InspectionWorkflowState;
  current_blocker_type: string | null;
  current_blocker_notes: string | null;
  current_blocker_reported_at: string | null;
  current_blocker_reported_by: string | null;
  current_blocker_resolution_notes: string | null;
  current_blocker_resolved_at: string | null;
  current_blocker_resolved_by: string | null;
  updated_at: string;
};

type WorkflowEventRow = {
  id: string;
  event_id: string;
  event_time: string;
  from_state: InspectionWorkflowState;
  to_state: InspectionWorkflowState;
  trigger: string;
  metadata: Record<string, unknown> | null;
  actor_profile_id: string | null;
};

export type OrderWorkflowSummary = {
  current_state: InspectionWorkflowState;
  blocker: {
    type: string | null;
    notes: string | null;
    reported_at: string | null;
    reported_by: ProfileSummary | null;
    resolution_notes: string | null;
    resolved_at: string | null;
    resolved_by: ProfileSummary | null;
  } | null;
  updated_at: string | null;
  history: Array<{
    id: string;
    event_id: string;
    event_time: string;
    from_state: InspectionWorkflowState;
    to_state: InspectionWorkflowState;
    trigger: string;
    metadata: Record<string, unknown>;
    actor: ProfileSummary | null;
  }>;
};

export function deriveInspectionWorkflowState(orderStatus?: string | null, hasStarted = false): InspectionWorkflowState {
  const normalized = (orderStatus ?? '').toLowerCase();

  if (normalized === 'completed' || normalized === 'delivered') return 'completed';
  if (normalized === 'pending_report') return 'ready_for_review';
  if (normalized === 'in_progress') return 'in_progress';
  if (hasStarted) return 'in_progress';
  return 'assigned';
}

export async function fetchOrderWorkflowSummary(
  supabase: SupabaseClient,
  tenantId: string,
  orderId: string,
  fallbackState: InspectionWorkflowState
): Promise<OrderWorkflowSummary> {
  const [{ data: stateRow, error: stateError }, { data: eventRows, error: eventsError }] = await Promise.all([
    supabase
      .from('order_workflow_states')
      .select(
        [
          'workflow_state',
          'current_blocker_type',
          'current_blocker_notes',
          'current_blocker_reported_at',
          'current_blocker_reported_by',
          'current_blocker_resolution_notes',
          'current_blocker_resolved_at',
          'current_blocker_resolved_by',
          'updated_at',
        ].join(', ')
      )
      .eq('tenant_id', tenantId)
      .eq('order_id', orderId)
      .maybeSingle(),
    supabase
      .from('order_workflow_events')
      .select('id, event_id, event_time, from_state, to_state, trigger, metadata, actor_profile_id')
      .eq('tenant_id', tenantId)
      .eq('order_id', orderId)
      .order('event_time', { ascending: false })
      .limit(20),
  ]);

  if (stateError) {
    throw stateError;
  }

  if (eventsError) {
    throw eventsError;
  }

  const typedState = (stateRow as WorkflowStateRow | null) ?? null;
  const typedEvents = ((eventRows ?? []) as WorkflowEventRow[]);

  const profileIds = new Set<string>();
  if (typedState?.current_blocker_reported_by) profileIds.add(typedState.current_blocker_reported_by);
  if (typedState?.current_blocker_resolved_by) profileIds.add(typedState.current_blocker_resolved_by);
  typedEvents.forEach((event) => {
    if (event.actor_profile_id) profileIds.add(event.actor_profile_id);
  });

  const profileMap = new Map<string, ProfileSummary>();
  if (profileIds.size > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .in('id', [...profileIds]);

    if (profilesError) {
      throw profilesError;
    }

    (profiles ?? []).forEach((profile) => {
      if (profile?.id) {
        profileMap.set(profile.id, {
          id: profile.id,
          full_name: profile.full_name ?? null,
          email: profile.email ?? null,
          avatar_url: profile.avatar_url ?? null,
        });
      }
    });
  }

  const currentState = typedState?.workflow_state ?? fallbackState;
  const blocker =
    currentState === 'waiting_for_info' || typedState?.current_blocker_type || typedState?.current_blocker_notes
      ? {
          type: typedState?.current_blocker_type ?? null,
          notes: typedState?.current_blocker_notes ?? null,
          reported_at: typedState?.current_blocker_reported_at ?? null,
          reported_by: typedState?.current_blocker_reported_by ? profileMap.get(typedState.current_blocker_reported_by) ?? null : null,
          resolution_notes: typedState?.current_blocker_resolution_notes ?? null,
          resolved_at: typedState?.current_blocker_resolved_at ?? null,
          resolved_by: typedState?.current_blocker_resolved_by ? profileMap.get(typedState.current_blocker_resolved_by) ?? null : null,
        }
      : null;

  return {
    current_state: currentState,
    blocker,
    updated_at: typedState?.updated_at ?? typedEvents[0]?.event_time ?? null,
    history: typedEvents.map((event) => ({
      id: event.id,
      event_id: event.event_id,
      event_time: event.event_time,
      from_state: event.from_state,
      to_state: event.to_state,
      trigger: event.trigger,
      metadata: event.metadata ?? {},
      actor: event.actor_profile_id ? profileMap.get(event.actor_profile_id) ?? null : null,
    })),
  };
}
