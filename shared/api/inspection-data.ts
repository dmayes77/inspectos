import type { ApiClient } from "./client";

export function createInspectionDataApi(apiClient: ApiClient) {
  return {
    getByOrderId: <T>(orderId: string) => apiClient.get<T>(`/admin/orders/${orderId}/data`),
  };
}
