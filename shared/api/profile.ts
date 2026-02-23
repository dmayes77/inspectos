import type { ApiClient } from "./client";

export function createProfileApi(apiClient: ApiClient) {
  return {
    get: <T>() => apiClient.get<T>("/admin/profile"),
    update: <T>(updates: unknown) => apiClient.put<T>("/admin/profile", updates),
  };
}
