import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import type { Tag } from "@/types/tag";
import { useApiClient } from "@/lib/api/tenant-context";

export function useTags() {
  const apiClient = useApiClient();
  return useGet<Tag[]>("tags", async () => {
    return await apiClient.get<Tag[]>('/admin/tags');
  });
}

export function useCreateTag() {
  const apiClient = useApiClient();
  return usePost<Tag, Partial<Tag>>("tags", async (data) => {
    return await apiClient.post<Tag>('/admin/tags', data);
  });
}

export function useUpdateTag() {
  const apiClient = useApiClient();
  return usePut<Tag, { id: string } & Partial<Tag>>("tags", async (data) => {
    return await apiClient.put<Tag>(`/admin/tags/${data.id}`, data);
  });
}

export function useDeleteTag() {
  const apiClient = useApiClient();
  return useDelete<boolean>("tags", async (id: string) => {
    return await apiClient.delete<boolean>(`/admin/tags/${id}`);
  });
}
