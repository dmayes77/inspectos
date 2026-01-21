import { useGet } from "@/hooks/crud";
import { fetchWorkflowRuns } from "@/lib/data/workflow-runs";
import type { WorkflowRun } from "@/types/workflow-run";

export function useWorkflowRuns() {
  return useGet<WorkflowRun[]>("workflow-runs", async () => fetchWorkflowRuns());
}
