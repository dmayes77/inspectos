import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import type { Tag } from "@/types/tag";
import { useApiClient } from "@/lib/api/tenant-context";
import { createTagsApi } from "@inspectos/shared/api";
import { tagsQueryKeys } from "@inspectos/shared/query";

export function useTags() {
  const apiClient = useApiClient();
  const tagsApi = createTagsApi(apiClient);
  return useGet<Tag[]>(tagsQueryKeys.all, async () => {
    return await tagsApi.list<Tag>();
  });
}

export function useCreateTag() {
  const apiClient = useApiClient();
  const tagsApi = createTagsApi(apiClient);
  return usePost<Tag, Partial<Tag>>(tagsQueryKeys.all, async (data) => {
    return await tagsApi.create<Tag>(data);
  });
}

export function useUpdateTag() {
  const apiClient = useApiClient();
  const tagsApi = createTagsApi(apiClient);
  return usePut<Tag, { id: string } & Partial<Tag>>(tagsQueryKeys.all, async (data) => {
    return await tagsApi.update<Tag>(data.id, data);
  });
}

export function useDeleteTag() {
  const apiClient = useApiClient();
  const tagsApi = createTagsApi(apiClient);
  return useDelete<boolean>(tagsQueryKeys.all, async (id: string) => {
    return await tagsApi.remove<boolean>(id);
  });
}
