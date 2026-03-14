import {
  INSPECTION_STATE_MACHINE_VERSION,
  INSPECTION_TRANSITION_TRIGGERS,
  INSPECTION_WORKFLOW_STATES,
  findInspectionTransitionRule,
  type InspectionTransitionRequestPayload,
  type InspectionTransitionResponsePayload,
  type InspectionTransitionTrigger,
  type InspectionWorkflowState,
} from '../../../shared/types/inspection-state-machine';

export type TransitionValidationFailure =
  | {
      code: 'INVALID_PAYLOAD';
      message: string;
    }
  | {
      code: 'TRANSITION_NOT_ALLOWED';
      message: string;
    }
  | {
      code: 'TRANSITION_CHECKS_FAILED';
      message: string;
      missingChecks: string[];
    };

export type OrderMembershipProfile = {
  id?: string;
  is_inspector?: boolean;
};

export type TransitionValidationResult =
  | {
      ok: true;
      payload: InspectionTransitionRequestPayload;
      result: InspectionTransitionResponsePayload;
    }
  | {
      ok: false;
      failure: TransitionValidationFailure;
    };

export function normalizeMembershipProfile(
  profile: OrderMembershipProfile | OrderMembershipProfile[] | null
): OrderMembershipProfile | null {
  if (Array.isArray(profile)) return profile[0] ?? null;
  return profile ?? null;
}

export function hasInspectorMobileAccess(role: string, isInspectorFlag?: boolean): boolean {
  return role === 'owner' || role === 'admin' || role === 'inspector' || Boolean(isInspectorFlag);
}

export function buildInspectorScopeUserIds(userId: string, profileId?: string): string[] {
  if (!profileId || profileId === userId) {
    return [userId];
  }

  return [userId, profileId];
}

export function parseTransitionRequestBody(value: unknown): InspectionTransitionRequestPayload | null {
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

export function validateInspectionTransitionRequest(
  payload: InspectionTransitionRequestPayload,
  orderId: string
): TransitionValidationResult {
  const transitionRule = findInspectionTransitionRule(
    payload.from_state,
    payload.to_state,
    payload.trigger
  );

  if (!transitionRule) {
    return {
      ok: false,
      failure: {
        code: 'TRANSITION_NOT_ALLOWED',
        message: `Transition not allowed: ${payload.from_state} -> ${payload.to_state} (${payload.trigger})`,
      },
    };
  }

  const missingChecks = transitionRule.required_checks.filter((check) => !payload.checks?.[check]);
  if (missingChecks.length > 0) {
    return {
      ok: false,
      failure: {
        code: 'TRANSITION_CHECKS_FAILED',
        message: 'One or more required transition checks are missing',
        missingChecks,
      },
    };
  }

  return {
    ok: true,
    payload,
    result: {
      accepted: true,
      order_id: orderId,
      event_id: payload.event_id,
      accepted_at: new Date().toISOString(),
      state_machine_version: INSPECTION_STATE_MACHINE_VERSION,
      from_state: payload.from_state,
      to_state: payload.to_state,
      trigger: payload.trigger,
      missing_checks: [],
    },
  };
}

function isWorkflowState(value: unknown): value is InspectionWorkflowState {
  return typeof value === 'string' && INSPECTION_WORKFLOW_STATES.includes(value as InspectionWorkflowState);
}

function isTransitionTrigger(value: unknown): value is InspectionTransitionTrigger {
  return typeof value === 'string' && INSPECTION_TRANSITION_TRIGGERS.includes(value as InspectionTransitionTrigger);
}
