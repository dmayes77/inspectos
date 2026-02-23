import type { ApiClient } from "./client";

export function createOrderNotesApi(apiClient: ApiClient) {
  return {
    list: <T>(orderId: string) => apiClient.get<T[]>(`/admin/orders/${orderId}/notes`),
    create: <T>(orderId: string, noteType: string, body: string) =>
      apiClient.post<T>(`/admin/orders/${orderId}/notes`, {
        note_type: noteType,
        body,
      }),
  };
}
