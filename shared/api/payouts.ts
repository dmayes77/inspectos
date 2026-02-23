import type { ApiClient } from "./client";

export function createPayoutsApi(apiClient: ApiClient) {
  return {
    list: <T>() => apiClient.get<T[]>("/admin/payouts"),
    payRules: <T>() => apiClient.get<T[]>("/admin/pay-rules"),
  };
}
