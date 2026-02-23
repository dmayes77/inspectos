import type { ApiClient } from "./client";

export function createLeadsApi(apiClient: ApiClient) {
  return {
    list: <T>() => apiClient.get<T[]>("/admin/leads"),
    getById: <T>(leadId: string) => apiClient.get<T>(`/admin/leads/${leadId}`),
    create: <T>(data: unknown) => apiClient.post<T>("/admin/leads", data),
    update: <T>(leadId: string, data: unknown) => apiClient.put<T>(`/admin/leads/${leadId}`, data),
    remove: <T>(leadId: string) => apiClient.delete<T>(`/admin/leads/${leadId}`),
  };
}
