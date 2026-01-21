import { useGet, usePut, usePost } from "@/hooks/crud";
import { fetchTemplates, fetchTemplateById, updateTemplate, createTemplateStub, duplicateTemplate } from "@/lib/data/templates";
import type { Template } from "@/types/template";

export function useTemplates() {
  return useGet<Template[]>("templates", async () => fetchTemplates());
}

export function useTemplate(id: string | null) {
  return useGet<Template | null>(
    id ? `template-${id}` : "template-null",
    async () => (id ? fetchTemplateById(id) : null),
    { enabled: !!id }
  );
}

export function useUpdateTemplate() {
  return usePut<Template, { id: string; data: Partial<Template> }>("templates", async ({ id, data }) => updateTemplate(id, data));
}

export function useCreateTemplateStub() {
  return usePost<Template, { name: string; description?: string }>("templates", async (payload) => createTemplateStub(payload));
}

export function useDuplicateTemplate() {
  return usePost<Template, string>("templates", async (id) => duplicateTemplate(id));
}
