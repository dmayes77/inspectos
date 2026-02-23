import { useGet } from "@/hooks/crud";
import type { WorkflowRun } from "@/types/workflow-run";
import { useApiClient } from "@/lib/api/tenant-context";

export function useWorkflowRuns() {
  const apiClient = useApiClient();
  return useGet<WorkflowRun[]>("workflow-runs", async () => {
    return await apiClient.get<WorkflowRun[]>('/admin/workflow-runs');
  });
}
