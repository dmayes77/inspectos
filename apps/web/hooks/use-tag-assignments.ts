import { useGet, usePost } from "@/hooks/crud";
import { createTagAssignment, deleteTagAssignment, fetchTagAssignments } from "@/lib/data/tag-assignments";
import type { TagScope } from "@/types/tag";

export function useTagAssignments(scope?: TagScope, entityId?: string) {
  return useGet<string[]>(
    `tag-assignments-${scope}-${entityId}`,
    () => fetchTagAssignments(scope as TagScope, entityId as string),
    { enabled: Boolean(scope && entityId) }
  );
}

export function useAssignTag(scope: TagScope, entityId: string) {
  return usePost(
    `tag-assignments-${scope}-${entityId}`,
    (tagId: string) => createTagAssignment(scope, entityId, tagId)
  );
}

export function useRemoveTag(scope: TagScope, entityId: string) {
  return usePost(
    `tag-assignments-${scope}-${entityId}`,
    (tagId: string) => deleteTagAssignment(scope, entityId, tagId)
  );
}
