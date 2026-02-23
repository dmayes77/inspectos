import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import type { Workflow } from "@/types/workflow";
import { useApiClient } from "@/lib/api/tenant-context";
import { createWorkflowsApi } from "@inspectos/shared/api";
import { workflowsQueryKeys } from "@inspectos/shared/query";

export function useWorkflows() {
  const apiClient = useApiClient();
  const workflowsApi = createWorkflowsApi(apiClient);
  return useGet<Workflow[]>(workflowsQueryKeys.all, async () => {
    return await workflowsApi.list<Workflow>();
  });
}

export function useCreateWorkflow() {
  const apiClient = useApiClient();
  const workflowsApi = createWorkflowsApi(apiClient);
  return usePost<Workflow, Partial<Workflow>>(workflowsQueryKeys.all, async (data) => {
    return await workflowsApi.create<Workflow>(data);
  });
}

export function useUpdateWorkflow() {
  const apiClient = useApiClient();
  const workflowsApi = createWorkflowsApi(apiClient);
  return usePut<Workflow, { id: string } & Partial<Workflow>>(
    workflowsQueryKeys.all,
    async (data) => {
      return await workflowsApi.update<Workflow>(data.id, data);
    }
  );
}

export function useDeleteWorkflow() {
  const apiClient = useApiClient();
  const workflowsApi = createWorkflowsApi(apiClient);
  return useDelete<boolean>(workflowsQueryKeys.all, async (id) => {
    return await workflowsApi.remove<boolean>(id);
  });
}
