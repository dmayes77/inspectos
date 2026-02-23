import type { ApiClient } from "./client";

export function createSettingsApi(apiClient: ApiClient) {
  return {
    get: <T>() => apiClient.get<T>("/admin/settings"),
    update: <T>(settings: unknown) => apiClient.put<T>("/admin/settings", settings),
    regenerateApiKey: <T>() => apiClient.post<T>("/admin/settings/api-key", undefined),
    createBillingPortalSession: <T>() => apiClient.post<T>("/admin/billing/portal", undefined),
    changeBillingPlan: <T>(payload: unknown) => apiClient.post<T>("/admin/billing/plan", payload),
  };
}
