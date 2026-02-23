import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";
import { createInspectionsApi } from "@inspectos/shared/api";
import { inspectionsQueryKeys } from "@inspectos/shared/query";
import type { Inspection } from "@inspectos/shared/types/inspection";

export function useInspections() {
  const apiClient = useApiClient();
  const inspectionsApi = createInspectionsApi(apiClient);
  return useGet<Inspection[]>(
    inspectionsQueryKeys.all,
    async () => {
      return await inspectionsApi.list();
    }
  );
}

export function useCreateInspection() {
  const apiClient = useApiClient();
  const inspectionsApi = createInspectionsApi(apiClient);
  return usePost<Inspection, Record<string, unknown>>(
    inspectionsQueryKeys.all,
    async (data) => {
      return await inspectionsApi.create(data);
    }
  );
}

export function useUpdateInspection() {
  const apiClient = useApiClient();
  const inspectionsApi = createInspectionsApi(apiClient);
  return usePut<Inspection | null, { inspectionId: string } & Record<string, unknown>>(
    inspectionsQueryKeys.all,
    async (data) => {
      return await inspectionsApi.update(data.inspectionId, data);
    }
  );
}

export function useDeleteInspection() {
  const apiClient = useApiClient();
  const inspectionsApi = createInspectionsApi(apiClient);
  return useDelete<boolean>(inspectionsQueryKeys.all, async (inspectionId: string) => {
    return await inspectionsApi.remove(inspectionId);
  });
}

export type { Inspection };
