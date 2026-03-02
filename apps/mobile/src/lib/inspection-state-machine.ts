import {
  INSPECTION_STATE_MACHINE_VERSION,
  INSPECTION_TRANSITIONS_V1,
  findInspectionTransitionRule,
  type InspectionTransitionCheck,
  type InspectionTransitionRequestPayload,
  type InspectionTransitionTrigger,
  type InspectionWorkflowState,
} from '../../../../shared/types/inspection-state-machine';

export type TransitionGuardResult =
  | { ok: true; missingChecks: InspectionTransitionCheck[] }
  | { ok: false; reason: string };

export function validateInspectionTransition(
  fromState: InspectionWorkflowState,
  toState: InspectionWorkflowState,
  trigger: InspectionTransitionTrigger,
  checks?: InspectionTransitionRequestPayload['checks']
): TransitionGuardResult {
  const rule = findInspectionTransitionRule(fromState, toState, trigger);
  if (!rule) {
    return { ok: false, reason: `Transition not allowed: ${fromState} -> ${toState} (${trigger})` };
  }

  const missingChecks = rule.required_checks.filter((check) => !checks?.[check]);
  if (missingChecks.length > 0) {
    return { ok: false, reason: `Missing required checks: ${missingChecks.join(', ')}` };
  }

  return { ok: true, missingChecks: [] };
}

export function buildInspectionTransitionRequest(input: {
  deviceId: string;
  fromState: InspectionWorkflowState;
  toState: InspectionWorkflowState;
  trigger: InspectionTransitionTrigger;
  checklistVersion?: string;
  checks?: InspectionTransitionRequestPayload['checks'];
  metadata?: Record<string, unknown>;
}): InspectionTransitionRequestPayload {
  return {
    event_id: crypto.randomUUID(),
    event_time: new Date().toISOString(),
    device_id: input.deviceId,
    state_machine_version: INSPECTION_STATE_MACHINE_VERSION,
    from_state: input.fromState,
    to_state: input.toState,
    trigger: input.trigger,
    checklist_version: input.checklistVersion,
    checks: input.checks,
    metadata: input.metadata,
  };
}

export const inspectionTransitionRules = INSPECTION_TRANSITIONS_V1;
