import { useGet, usePut, usePost } from "@/hooks/crud";
import type { Template } from "@/types/template";
import { useApiClient } from "@/lib/api/tenant-context";
import { createTemplatesApi } from "@inspectos/shared/api";
import { templatesQueryKeys } from "@inspectos/shared/query";

export function useTemplates() {
  const apiClient = useApiClient();
  const templatesApi = createTemplatesApi(apiClient);
  return useGet<Template[]>(templatesQueryKeys.all, async () => {
    return await templatesApi.list<Template>();
  });
}

export function useTemplate(id: string | null) {
  const apiClient = useApiClient();
  const templatesApi = createTemplatesApi(apiClient);
  return useGet<Template | null>(
    id ? templatesQueryKeys.detail(id) : ["templates", "detail", "null"],
    async () => {
      if (!id) return null;
      try {
        return await templatesApi.getById<Template>(id);
      } catch {
        return null;
      }
    },
    { enabled: !!id }
  );
}

export function useUpdateTemplate() {
  const apiClient = useApiClient();
  const templatesApi = createTemplatesApi(apiClient);
  return usePut<Template, { id: string; data: Partial<Template> }>(templatesQueryKeys.all, async ({ id, data }) => {
    return await templatesApi.update<Template>(id, data);
  });
}

export function useCreateTemplateStub() {
  const apiClient = useApiClient();
  const templatesApi = createTemplatesApi(apiClient);
  return usePost<Template, { name: string; description?: string }>(templatesQueryKeys.all, async (payload) => {
    return await templatesApi.createStub<Template>(payload);
  });
}

export function useDuplicateTemplate() {
  const apiClient = useApiClient();
  const templatesApi = createTemplatesApi(apiClient);
  return usePost<Template, string>(templatesQueryKeys.all, async (id) => {
    return await templatesApi.duplicate<Template>(id);
  });
}
