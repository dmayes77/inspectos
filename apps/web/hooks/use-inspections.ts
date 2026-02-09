import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import type { Inspection } from "@/types/inspection";
import { useApiClient } from "@/lib/api/tenant-context";

export function useInspections() {
  const apiClient = useApiClient();
  return useGet<Inspection[]>(
    "inspections",
    async () => {
      const result = await apiClient.get<Inspection[]>("/admin/inspections");
      return result ?? [];
    }
  );
}

export function useCreateInspection() {
  const apiClient = useApiClient();
  return usePost<Inspection, Record<string, unknown>>(
    "inspections",
    async (data) => {
      return await apiClient.post<Inspection>("/admin/inspections", data);
    }
  );
}

export function useUpdateInspection() {
  const apiClient = useApiClient();
  return usePut<Inspection | null, { inspectionId: string } & Record<string, unknown>>(
    "inspections",
    async (data) => {
      return await apiClient.put<Inspection>(`/admin/inspections/${data.inspectionId}`, data);
    }
  );
}

export function useDeleteInspection() {
  const apiClient = useApiClient();
  return useDelete<boolean>("inspections", async (inspectionId: string) => {
    const result = await apiClient.delete<{ deleted: boolean } | boolean>(`/admin/inspections/${inspectionId}`);
    return typeof result === "boolean" ? result : (result.deleted ?? true);
  });
}

export type { Inspection };
