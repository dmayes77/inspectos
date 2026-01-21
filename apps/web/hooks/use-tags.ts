import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import { fetchTags, createTag, updateTag, deleteTag } from "@/lib/data/tags";
import type { Tag } from "@/types/tag";

export function useTags() {
  return useGet<Tag[]>("tags", async () => fetchTags());
}

export function useCreateTag() {
  return usePost<Tag, Partial<Tag>>("tags", async (data) => createTag(data));
}

export function useUpdateTag() {
  return usePut<Tag, { id: string } & Partial<Tag>>("tags", async (data) => updateTag(data.id, data));
}

export function useDeleteTag() {
  return useDelete<boolean>("tags", async (id: string) => deleteTag(id));
}
