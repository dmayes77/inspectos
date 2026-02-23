import type { ApiClient } from "./client";

export function createIntegrationsApi(apiClient: ApiClient) {
  return {
    list: <T>() => apiClient.get<T[]>("/admin/integrations"),
    connect: <T>(payload: unknown) => apiClient.post<T>("/admin/integrations", payload),
    disconnect: (id: string) => apiClient.delete(`/admin/integrations/${id}`),
  };
}
