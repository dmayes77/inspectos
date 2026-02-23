import type { ApiClient } from "./client";

export function createTagsApi(apiClient: ApiClient) {
  return {
    list: <T>() => apiClient.get<T[]>("/admin/tags"),
    create: <T>(data: unknown) => apiClient.post<T>("/admin/tags", data),
    update: <T>(id: string, data: unknown) => apiClient.put<T>(`/admin/tags/${id}`, data),
    remove: <T>(id: string) => apiClient.delete<T>(`/admin/tags/${id}`),
  };
}
