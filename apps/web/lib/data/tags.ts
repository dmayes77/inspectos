import type { Tag } from "@/types/tag";

export async function fetchTags(): Promise<Tag[]> {
  const response = await fetch("/api/admin/tags");
  if (!response.ok) {
    throw new Error("Failed to load tags.");
  }
  return response.json();
}

export async function createTag(data: Partial<Tag>): Promise<Tag> {
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

export async function updateTag(id: string, data: Partial<Tag>): Promise<Tag> {
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

export async function deleteTag(id: string): Promise<boolean> {
  const response = await fetch(`/api/admin/tags/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete tag.");
  }
  return response.json();
}
