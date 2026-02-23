import type { ApiClient } from "./client";

export function createEmailTemplatesApi(apiClient: ApiClient) {
  return {
    list: <T>() => apiClient.get<T[]>("/admin/email-templates"),
    create: <T>(data: unknown) => apiClient.post<T>("/admin/email-templates", data),
    update: <T>(id: string, data: unknown) => apiClient.put<T>(`/admin/email-templates/${id}`, data),
    remove: <T>(id: string) => apiClient.delete<T>(`/admin/email-templates/${id}`),
  };
}
