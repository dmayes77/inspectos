import type { ApiClient } from "./client";

export function createVendorsApi(apiClient: ApiClient) {
  return {
    list: <T>() => apiClient.get<T[]>("/admin/vendors"),
    getById: <T>(id: string) => apiClient.get<T>(`/admin/vendors/${id}`),
    create: <T>(data: unknown) => apiClient.post<T>("/admin/vendors", data),
    update: <T>(id: string, data: unknown) => apiClient.put<T>(`/admin/vendors/${id}`, data),
    remove: <T>(id: string) => apiClient.delete<T>(`/admin/vendors/${id}`),
  };
}
