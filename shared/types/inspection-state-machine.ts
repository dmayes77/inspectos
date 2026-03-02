export const INSPECTION_STATE_MACHINE_VERSION = 'v1' as const;

export const INSPECTION_WORKFLOW_STATES = [
  'not_assigned',
  'assigned',
  'arrived',
  'in_progress',
  'paused',
  'waiting_for_info',
  'uploading',
  'ready_for_review',
  'corrections_required',
  'completed',
] as const;

export type InspectionWorkflowState = (typeof INSPECTION_WORKFLOW_STATES)[number];

export const INSPECTION_TRANSITION_TRIGGERS = [
  'ORDER_ACCEPTED',
  'ARRIVAL_CONFIRMED',
  'INSPECTION_STARTED',
  'INSPECTION_PAUSED',
  'INSPECTION_RESUMED',
  'BLOCKER_REPORTED',
  'BLOCKER_CLEARED',
  'SYNC_STARTED',
  'SYNC_COMPLETED',
  'QA_REJECTED',
  'CORRECTIONS_ACKNOWLEDGED',
  'QA_APPROVED',
  'AUTO_APPROVED',
] as const;

export type InspectionTransitionTrigger = (typeof INSPECTION_TRANSITION_TRIGGERS)[number];

export const INSPECTION_TRANSITION_CHECKS = [
  'inspector_membership_verified',
  'order_assigned_to_inspector',
  'checklist_version_matches',
  'checklist_payload_present',
  'active_session_exists',
  'blocker_open',
  'required_evidence_uploaded',
  'required_items_completed',
  'reviewer_permission_verified',
  'no_open_corrections',
] as const;

export type InspectionTransitionCheck = (typeof INSPECTION_TRANSITION_CHECKS)[number];

export type InspectionTransitionRule = {
  from: InspectionWorkflowState;
  to: InspectionWorkflowState;
  trigger: InspectionTransitionTrigger;
  required_checks: readonly InspectionTransitionCheck[];
};

export const INSPECTION_TRANSITIONS_V1: readonly InspectionTransitionRule[] = [
  {
    from: 'not_assigned',
    to: 'assigned',
    trigger: 'ORDER_ACCEPTED',
    required_checks: ['inspector_membership_verified'],
  },
  {
    from: 'assigned',
    to: 'arrived',
    trigger: 'ARRIVAL_CONFIRMED',
    required_checks: ['order_assigned_to_inspector'],
  },
  {
    from: 'arrived',
    to: 'in_progress',
    trigger: 'INSPECTION_STARTED',
    required_checks: ['checklist_version_matches', 'checklist_payload_present'],
  },
  {
    from: 'in_progress',
    to: 'paused',
    trigger: 'INSPECTION_PAUSED',
    required_checks: ['active_session_exists'],
  },
  {
    from: 'paused',
    to: 'in_progress',
    trigger: 'INSPECTION_RESUMED',
    required_checks: ['active_session_exists'],
  },
  {
    from: 'in_progress',
    to: 'waiting_for_info',
    trigger: 'BLOCKER_REPORTED',
    required_checks: ['active_session_exists'],
  },
  {
    from: 'waiting_for_info',
    to: 'in_progress',
    trigger: 'BLOCKER_CLEARED',
    required_checks: ['blocker_open'],
  },
  {
    from: 'in_progress',
    to: 'uploading',
    trigger: 'SYNC_STARTED',
    required_checks: ['active_session_exists'],
  },
  {
    from: 'uploading',
    to: 'ready_for_review',
    trigger: 'SYNC_COMPLETED',
    required_checks: ['required_items_completed', 'required_evidence_uploaded'],
  },
  {
    from: 'ready_for_review',
    to: 'corrections_required',
    trigger: 'QA_REJECTED',
    required_checks: ['reviewer_permission_verified'],
  },
  {
    from: 'corrections_required',
    to: 'in_progress',
    trigger: 'CORRECTIONS_ACKNOWLEDGED',
    required_checks: ['active_session_exists'],
  },
  {
    from: 'ready_for_review',
    to: 'completed',
    trigger: 'QA_APPROVED',
    required_checks: ['no_open_corrections', 'required_items_completed', 'required_evidence_uploaded'],
  },
  {
    from: 'ready_for_review',
    to: 'completed',
    trigger: 'AUTO_APPROVED',
    required_checks: ['no_open_corrections', 'required_items_completed', 'required_evidence_uploaded'],
  },
] as const;

export type InspectionTransitionChecksPayload = Partial<Record<InspectionTransitionCheck, boolean>>;

export type InspectionTransitionRequestPayload = {
  event_id: string;
  event_time: string;
  device_id: string;
  state_machine_version: typeof INSPECTION_STATE_MACHINE_VERSION;
  from_state: InspectionWorkflowState;
  to_state: InspectionWorkflowState;
  trigger: InspectionTransitionTrigger;
  checklist_version?: string;
  checks?: InspectionTransitionChecksPayload;
  metadata?: Record<string, unknown>;
};

export type InspectionTransitionResponsePayload = {
  accepted: boolean;
  order_id: string;
  event_id: string;
  accepted_at: string;
  state_machine_version: typeof INSPECTION_STATE_MACHINE_VERSION;
  from_state: InspectionWorkflowState;
  to_state: InspectionWorkflowState;
  trigger: InspectionTransitionTrigger;
  missing_checks: InspectionTransitionCheck[];
};

export function findInspectionTransitionRule(
  from: InspectionWorkflowState,
  to: InspectionWorkflowState,
  trigger: InspectionTransitionTrigger
): InspectionTransitionRule | null {
  return INSPECTION_TRANSITIONS_V1.find(
    (rule) => rule.from === from && rule.to === to && rule.trigger === trigger
  ) ?? null;
}
