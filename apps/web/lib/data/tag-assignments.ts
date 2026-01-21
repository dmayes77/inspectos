import type { TagScope } from "@/types/tag";

type TagAssignmentResponse = {
  tagIds: string[];
};

export async function fetchTagAssignments(scope: TagScope, entityId: string): Promise<string[]> {
  const response = await fetch(`/api/admin/tag-assignments?scope=${scope}&entityId=${entityId}`);
  if (!response.ok) {
    throw new Error("Failed to load tag assignments.");
  }
  const data = (await response.json()) as TagAssignmentResponse;
  return data.tagIds ?? [];
}

export async function createTagAssignment(scope: TagScope, entityId: string, tagId: string) {
  const response = await fetch("/api/admin/tag-assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scope, entityId, tagId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error ?? "Failed to assign tag.");
  }
  return response.json();
}

export async function deleteTagAssignment(scope: TagScope, entityId: string, tagId: string) {
  const response = await fetch(`/api/admin/tag-assignments?scope=${scope}&entityId=${entityId}&tagId=${tagId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error ?? "Failed to remove tag.");
  }
  return response.json();
}
