import { useGet, usePost } from "@/hooks/crud";
import type { TagScope } from "@/types/tag";
import { useApiClient } from "@/lib/api/tenant-context";

type TagAssignmentResponse = {
  tagIds: string[];
};

export function useTagAssignments(scope?: TagScope, entityId?: string) {
  const apiClient = useApiClient();
  return useGet<string[]>(
    `tag-assignments-${scope}-${entityId}`,
    async () => {
      const data = await apiClient.get<TagAssignmentResponse>(`/admin/tag-assignments?scope=${scope}&entityId=${entityId}`);
      return data.tagIds ?? [];
    },
    { enabled: Boolean(scope && entityId) }
  );
}

export function useAssignTag(scope: TagScope, entityId: string) {
  const apiClient = useApiClient();
  return usePost(
    `tag-assignments-${scope}-${entityId}`,
    (tagId: string) => apiClient.post("/admin/tag-assignments", { scope, entityId, tagId })
  );
}

export function useRemoveTag(scope: TagScope, entityId: string) {
  const apiClient = useApiClient();
  return usePost(
    `tag-assignments-${scope}-${entityId}`,
    (tagId: string) => apiClient.delete(`/admin/tag-assignments?scope=${scope}&entityId=${entityId}&tagId=${tagId}`)
  );
}
