import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import type { Workflow } from "@/types/workflow";
import { useApiClient } from "@/lib/api/tenant-context";

export function useWorkflows() {
  const apiClient = useApiClient();
  return useGet<Workflow[]>("workflows", async () => {
    return await apiClient.get<Workflow[]>('/admin/workflows');
  });
}

export function useCreateWorkflow() {
  const apiClient = useApiClient();
  return usePost<Workflow, Partial<Workflow>>("workflows", async (data) => {
    return await apiClient.post<Workflow>('/admin/workflows', data);
  });
}

export function useUpdateWorkflow() {
  const apiClient = useApiClient();
  return usePut<Workflow, { id: string } & Partial<Workflow>>(
    "workflows",
    async (data) => {
      return await apiClient.put<Workflow>(`/admin/workflows/${data.id}`, data);
    }
  );
}

export function useDeleteWorkflow() {
  const apiClient = useApiClient();
  return useDelete<boolean>("workflows", async (id) => {
    return await apiClient.delete<boolean>(`/admin/workflows/${id}`);
  });
}
