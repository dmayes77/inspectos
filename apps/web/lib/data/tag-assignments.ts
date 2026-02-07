import type { TagScope } from "@/types/tag";
import { shouldUseExternalApi } from "@/lib/api/feature-flags";
import { createApiClient } from "@/lib/api/client";

function getTenantSlug(): string {
  const isDevelopment =
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' ||
    process.env.NEXT_PUBLIC_IS_DEV_DEPLOYMENT === 'true';
  if (typeof window !== "undefined") {
    const pathParts = window.location.pathname.split("/");
    return pathParts[1] || "default";
  }
  return "default";
}

type TagAssignmentResponse = {
  tagIds: string[];
};

export async function fetchTagAssignments(scope: TagScope, entityId: string): Promise<string[]> {
  if (shouldUseExternalApi("tagAssignments")) {
    const apiClient = createApiClient(getTenantSlug());
    const data = await apiClient.get<TagAssignmentResponse>(`/admin/tag-assignments?scope=${scope}&entityId=${entityId}`);
    return data.tagIds ?? [];
  } else {
    const response = await fetch(`/api/admin/tag-assignments?scope=${scope}&entityId=${entityId}`);
    if (!response.ok) {
      throw new Error("Failed to load tag assignments.");
    }
    const data = (await response.json()) as TagAssignmentResponse;
    return data.tagIds ?? [];
  }
}

export async function createTagAssignment(scope: TagScope, entityId: string, tagId: string) {
  if (shouldUseExternalApi("tagAssignments")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.post("/admin/tag-assignments", { scope, entityId, tagId });
  } else {
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
}

export async function deleteTagAssignment(scope: TagScope, entityId: string, tagId: string) {
  if (shouldUseExternalApi("tagAssignments")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.delete(`/admin/tag-assignments?scope=${scope}&entityId=${entityId}&tagId=${tagId}`);
  } else {
    const response = await fetch(`/api/admin/tag-assignments?scope=${scope}&entityId=${entityId}&tagId=${tagId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.error ?? "Failed to remove tag.");
    }
    return response.json();
  }
}
