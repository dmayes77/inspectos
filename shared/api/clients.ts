import type { ApiClient } from "./client";
import type { CRMClient, CreateCRMClientInput, UpdateCRMClientInput } from "../types/crm-client";

export function createClientsApi(apiClient: ApiClient) {
  return {
    list: async (): Promise<CRMClient[]> => {
      return apiClient.get<CRMClient[]>("/admin/clients");
    },
    getById: async (clientId: string): Promise<CRMClient> => {
      return apiClient.get<CRMClient>(`/admin/clients/${clientId}`);
    },
    create: async (data: CreateCRMClientInput): Promise<CRMClient> => {
      return apiClient.post<CRMClient>("/admin/clients", data);
    },
    update: async (data: UpdateCRMClientInput): Promise<CRMClient | null> => {
      return apiClient.put<CRMClient>(`/admin/clients/${data.clientId}`, data);
    },
    remove: async (clientId: string): Promise<boolean> => {
      const result = await apiClient.delete<{ deleted: boolean }>(`/admin/clients/${clientId}`);
      return result.deleted ?? true;
    },
  };
}
