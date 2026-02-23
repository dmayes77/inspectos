import { useGet } from "@/hooks/crud";
import type { WorkflowRun } from "@/types/workflow-run";
import { useApiClient } from "@/lib/api/tenant-context";
import { createWorkflowRunsApi } from "@inspectos/shared/api";
import { workflowRunsQueryKeys } from "@inspectos/shared/query";

export function useWorkflowRuns() {
  const apiClient = useApiClient();
  const workflowRunsApi = createWorkflowRunsApi(apiClient);
  return useGet<WorkflowRun[]>(workflowRunsQueryKeys.all, async () => {
    return await workflowRunsApi.list<WorkflowRun>();
  });
}
