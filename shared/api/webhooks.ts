import type { ApiClient } from "./client";

export function createWebhooksApi(apiClient: ApiClient) {
  return {
    list: <T>() => apiClient.get<T[]>("/admin/webhooks"),
    getById: <T>(id: string) => apiClient.get<T>(`/admin/webhooks/${id}`),
    create: <T>(data: unknown) => apiClient.post<T>("/admin/webhooks", data),
    update: <T>(id: string, data: unknown) => apiClient.put<T>(`/admin/webhooks/${id}`, data),
    remove: <T>(id: string) => apiClient.delete<T>(`/admin/webhooks/${id}`),
    test: <T>(id: string, event: string) => apiClient.post<T>(`/admin/webhooks/${id}/test`, { event }),
  };
}
