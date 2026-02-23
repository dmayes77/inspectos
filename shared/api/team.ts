import type { ApiClient } from "./client";

export function createTeamApi(apiClient: ApiClient) {
  return {
    inspectors: <T>() => apiClient.get<T[]>("/admin/inspectors"),
    list: <T>() => apiClient.get<T[]>("/admin/team"),
    create: <T>(payload: unknown) => apiClient.post<T>("/admin/team", payload),
    update: (memberId: string, data: unknown) => apiClient.put(`/admin/team/${memberId}`, data),
    remove: (memberId: string) => apiClient.delete(`/admin/team/${memberId}`),
  };
}
