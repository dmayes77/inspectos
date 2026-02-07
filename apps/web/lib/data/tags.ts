import type { Tag } from "@/types/tag";
import { shouldUseExternalApi } from "@/lib/api/feature-flags";
import { createApiClient } from "@/lib/api/client";

function getTenantSlug(): string {
  if (typeof window !== "undefined") {
    const pathParts = window.location.pathname.split("/");
    return pathParts[1] || "default";
  }
  return "default";
}

export async function fetchTags(): Promise<Tag[]> {
  if (shouldUseExternalApi("tags")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.get<Tag[]>("/admin/tags");
  } else {
    const response = await fetch("/api/admin/tags");
    if (!response.ok) {
      throw new Error("Failed to load tags.");
    }
    return response.json();
  }
}

export async function createTag(data: Partial<Tag>): Promise<Tag> {
  if (shouldUseExternalApi("tags")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.post<Tag>("/admin/tags", data);
  } else {
    const response = await fetch("/api/admin/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to create tag.");
    }
    return response.json();
  }
}

export async function updateTag(id: string, data: Partial<Tag>): Promise<Tag> {
  if (shouldUseExternalApi("tags")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.put<Tag>(`/admin/tags/${id}`, data);
  } else {
    const response = await fetch(`/api/admin/tags/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to update tag.");
    }
    return response.json();
  }
}

export async function deleteTag(id: string): Promise<boolean> {
  if (shouldUseExternalApi("tags")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.delete<boolean>(`/admin/tags/${id}`);
  } else {
    const response = await fetch(`/api/admin/tags/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete tag.");
    }
    return response.json();
  }
}
