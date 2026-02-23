import type { ApiClient } from "./client";
import type { ServiceType } from "../types/service";

export function createServicesApi(apiClient: ApiClient) {
  return {
    list: async (): Promise<ServiceType[]> => {
      const result = await apiClient.get<ServiceType[]>("/admin/services");
      return result ?? [];
    },
    create: async (data: Partial<ServiceType>): Promise<ServiceType> => {
      return apiClient.post<ServiceType>("/admin/services", data);
    },
    update: async (serviceId: string, data: Partial<ServiceType>): Promise<ServiceType> => {
      return apiClient.put<ServiceType>(`/admin/services/${serviceId}`, data);
    },
    remove: async (serviceId: string): Promise<boolean> => {
      const result = await apiClient.delete<{ deleted: boolean }>(`/admin/services/${serviceId}`);
      return result.deleted ?? true;
    },
  };
}
