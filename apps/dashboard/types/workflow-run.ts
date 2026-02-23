export type WorkflowRunStatus = "pending" | "running" | "completed" | "failed";

export type WorkflowRun = {
  id: string;
  workflowId: string;
  scope: string;
  entityId: string;
  status: WorkflowRunStatus;
  error?: string | null;
  startedAt: string;
  completedAt?: string | null;
};
