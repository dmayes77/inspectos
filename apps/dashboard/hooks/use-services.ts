import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";
import { createServicesApi } from "@inspectos/shared/api";
import { servicesQueryKeys } from "@inspectos/shared/query";
import type { ServiceType as Service } from "@inspectos/shared/types/service";

export type { Service };

export function useServices() {
  const apiClient = useApiClient();
  const servicesApi = createServicesApi(apiClient);
  return useGet<Service[]>(
    servicesQueryKeys.all,
    async () => {
      return await servicesApi.list();
    },
    { placeholderData: [] }
  );
}

export function useCreateService() {
  const apiClient = useApiClient();
  const servicesApi = createServicesApi(apiClient);
  return usePost<Service, Partial<Service>>(servicesQueryKeys.all, async (data) => {
    return await servicesApi.create(data);
  });
}

export function useUpdateService() {
  const apiClient = useApiClient();
  const servicesApi = createServicesApi(apiClient);
  return usePut<Service | null, { serviceId: string } & Partial<Service>>(
    servicesQueryKeys.all,
    async (data) => {
      return await servicesApi.update(data.serviceId, data);
    }
  );
}

export function useDeleteService() {
  const apiClient = useApiClient();
  const servicesApi = createServicesApi(apiClient);
  return useDelete<boolean>(servicesQueryKeys.all, async (serviceId: string) => {
    return await servicesApi.remove(serviceId);
  });
}
