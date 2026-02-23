import type { ApiClient } from "./client";

export function createTagAssignmentsApi(apiClient: ApiClient) {
  return {
    list: <T>(scope: string, entityId: string) =>
      apiClient.get<T>(`/admin/tag-assignments?scope=${scope}&entityId=${entityId}`),
    assign: (scope: string, entityId: string, tagId: string) =>
      apiClient.post("/admin/tag-assignments", { scope, entityId, tagId }),
    remove: (scope: string, entityId: string, tagId: string) =>
      apiClient.delete(`/admin/tag-assignments?scope=${scope}&entityId=${entityId}&tagId=${tagId}`),
  };
}
