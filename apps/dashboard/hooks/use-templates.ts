import { useGet, usePut, usePost } from "@/hooks/crud";
import type { Template } from "@/types/template";
import { useApiClient } from "@/lib/api/tenant-context";

export function useTemplates() {
  const apiClient = useApiClient();
  return useGet<Template[]>("templates", async () => {
    return await apiClient.get<Template[]>('/admin/templates');
  });
}

export function useTemplate(id: string | null) {
  const apiClient = useApiClient();
  return useGet<Template | null>(
    id ? `template-${id}` : "template-null",
    async () => {
      if (!id) return null;
      try {
        return await apiClient.get<Template>(`/admin/templates/${id}`);
      } catch {
        return null;
      }
    },
    { enabled: !!id }
  );
}

export function useUpdateTemplate() {
  const apiClient = useApiClient();
  return usePut<Template, { id: string; data: Partial<Template> }>("templates", async ({ id, data }) => {
    return await apiClient.put(`/admin/templates/${id}`, data);
  });
}

export function useCreateTemplateStub() {
  const apiClient = useApiClient();
  return usePost<Template, { name: string; description?: string }>("templates", async (payload) => {
    return await apiClient.post('/admin/templates', { action: 'create_stub', ...payload });
  });
}

export function useDuplicateTemplate() {
  const apiClient = useApiClient();
  return usePost<Template, string>("templates", async (id) => {
    return await apiClient.post<Template>(`/admin/templates/${id}/duplicate`, {});
  });
}
