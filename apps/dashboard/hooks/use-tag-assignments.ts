import { useGet, usePost } from "@/hooks/crud";
import type { TagScope } from "@/types/tag";
import { useApiClient } from "@/lib/api/tenant-context";
import { createTagAssignmentsApi } from "@inspectos/shared/api";
import { tagAssignmentsQueryKeys } from "@inspectos/shared/query";

type TagAssignmentResponse = {
  tagIds: string[];
};

export function useTagAssignments(scope?: TagScope, entityId?: string) {
  const apiClient = useApiClient();
  const tagAssignmentsApi = createTagAssignmentsApi(apiClient);
  return useGet<string[]>(
    tagAssignmentsQueryKeys.list(scope ?? "unknown", entityId ?? "unknown"),
    async () => {
      const data = await tagAssignmentsApi.list<TagAssignmentResponse>(scope ?? "", entityId ?? "");
      return data.tagIds ?? [];
    },
    { enabled: Boolean(scope && entityId) }
  );
}

export function useAssignTag(scope: TagScope, entityId: string) {
  const apiClient = useApiClient();
  const tagAssignmentsApi = createTagAssignmentsApi(apiClient);
  return usePost(
    tagAssignmentsQueryKeys.list(scope, entityId),
    (tagId: string) => tagAssignmentsApi.assign(scope, entityId, tagId)
  );
}

export function useRemoveTag(scope: TagScope, entityId: string) {
  const apiClient = useApiClient();
  const tagAssignmentsApi = createTagAssignmentsApi(apiClient);
  return usePost(
    tagAssignmentsQueryKeys.list(scope, entityId),
    (tagId: string) => tagAssignmentsApi.remove(scope, entityId, tagId)
  );
}
