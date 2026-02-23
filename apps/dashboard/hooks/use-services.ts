import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import type { ServiceType as Service } from "@/types/service";
import { useApiClient } from "@/lib/api/tenant-context";

export type { Service };

export function useServices() {
  const apiClient = useApiClient();
  return useGet<Service[]>(
    "services",
    async () => {
      const result = await apiClient.get<Service[]>("/admin/services");
      return result ?? [];
    },
    { placeholderData: [] }
  );
}

export function useCreateService() {
  const apiClient = useApiClient();
  return usePost<Service, Partial<Service>>("services", async (data) => {
    return await apiClient.post<Service>("/admin/services", data);
  });
}

export function useUpdateService() {
  const apiClient = useApiClient();
  return usePut<Service | null, { serviceId: string } & Partial<Service>>(
    "services",
    async (data) => {
      return await apiClient.put<Service>(`/admin/services/${data.serviceId}`, data);
    }
  );
}

export function useDeleteService() {
  const apiClient = useApiClient();
  return useDelete<boolean>("services", async (serviceId: string) => {
    const result = await apiClient.delete<{ deleted: boolean }>(`/admin/services/${serviceId}`);
    return result.deleted ?? true;
  });
}
