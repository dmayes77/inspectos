import type { WorkflowRun } from "@/types/workflow-run";

export async function fetchWorkflowRuns(): Promise<WorkflowRun[]> {
  const response = await fetch("/api/admin/workflow-runs");
  if (!response.ok) {
    throw new Error("Failed to load workflow runs.");
  }
  return response.json();
}
