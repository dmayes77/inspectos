import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import { fetchWorkflows, createWorkflow, updateWorkflow, deleteWorkflow } from "@/lib/data/workflows";
import type { Workflow } from "@/types/workflow";

export function useWorkflows() {
  return useGet<Workflow[]>("workflows", async () => fetchWorkflows());
}

export function useCreateWorkflow() {
  return usePost<Workflow, Partial<Workflow>>("workflows", async (data) => createWorkflow(data));
}

export function useUpdateWorkflow() {
  return usePut<Workflow, { id: string } & Partial<Workflow>>(
    "workflows",
    async (data) => updateWorkflow(data.id, data)
  );
}

export function useDeleteWorkflow() {
  return useDelete<boolean>("workflows", async (id) => deleteWorkflow(id));
}
