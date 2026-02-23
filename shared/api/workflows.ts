import type { ApiClient } from "./client";

export function createWorkflowsApi(apiClient: ApiClient) {
  return {
    list: <T>() => apiClient.get<T[]>("/admin/workflows"),
    create: <T>(data: unknown) => apiClient.post<T>("/admin/workflows", data),
    update: <T>(id: string, data: unknown) => apiClient.put<T>(`/admin/workflows/${id}`, data),
    remove: <T>(id: string) => apiClient.delete<T>(`/admin/workflows/${id}`),
  };
}
