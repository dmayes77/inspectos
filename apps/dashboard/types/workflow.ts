export type WorkflowScope = "lead" | "client" | "inspection" | "invoice" | "job" | "payment" | "service" | "template";
export type WorkflowTriggerType = "tag_added" | "tag_removed" | "status_changed" | "event";

export type Workflow = {
  id: string;
  name: string;
  description?: string | null;
  triggerScope: WorkflowScope;
  triggerType: WorkflowTriggerType;
  triggerTagId?: string | null;
  conditions?: Record<string, unknown>;
  actions?: Record<string, unknown>[];
  delayMinutes?: number;
  isActive?: boolean;
  isSystem?: boolean;
};
