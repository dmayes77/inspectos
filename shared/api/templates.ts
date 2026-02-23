import type { ApiClient } from "./client";

export function createTemplatesApi(apiClient: ApiClient) {
  return {
    list: <T>() => apiClient.get<T[]>("/admin/templates"),
    getById: <T>(id: string) => apiClient.get<T>(`/admin/templates/${id}`),
    update: <T>(id: string, data: unknown) => apiClient.put<T>(`/admin/templates/${id}`, data),
    createStub: <T>(payload: { name: string; description?: string }) =>
      apiClient.post<T>("/admin/templates", { action: "create_stub", ...payload }),
    duplicate: <T>(id: string) => apiClient.post<T>(`/admin/templates/${id}/duplicate`, {}),
  };
}
