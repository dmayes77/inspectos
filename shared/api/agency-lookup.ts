import type { ApiClient } from "./client";

export function createAgencyLookupApi(apiClient: ApiClient) {
  return {
    search: async <TResponse>(query: string, signal?: AbortSignal): Promise<TResponse> => {
      return apiClient.get<TResponse>(`/admin/agencies/lookup?q=${encodeURIComponent(query)}`, { signal });
    },
  };
}
