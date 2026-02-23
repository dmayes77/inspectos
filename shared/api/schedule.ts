import type { ApiClient } from "./client";

export function createScheduleApi(apiClient: ApiClient) {
  return {
    list: <T>(from?: string, to?: string) => {
      const params = new URLSearchParams();
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      const endpoint = params.toString() ? `/admin/schedule?${params}` : "/admin/schedule";
      return apiClient.get<T[]>(endpoint);
    },
  };
}
