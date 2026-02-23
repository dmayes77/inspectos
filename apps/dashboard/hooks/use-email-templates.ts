import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import type { EmailTemplate } from "@/types/email-template";
import { useApiClient } from "@/lib/api/tenant-context";

export function useEmailTemplates() {
  const apiClient = useApiClient();
  return useGet<EmailTemplate[]>("email-templates", async () => {
    return await apiClient.get<EmailTemplate[]>('/admin/email-templates');
  });
}

export function useCreateEmailTemplate() {
  const apiClient = useApiClient();
  return usePost<EmailTemplate, Partial<EmailTemplate>>("email-templates", async (data) => {
    return await apiClient.post<EmailTemplate>('/admin/email-templates', data);
  });
}

export function useUpdateEmailTemplate() {
  const apiClient = useApiClient();
  return usePut<EmailTemplate, { id: string } & Partial<EmailTemplate>>(
    "email-templates",
    async (data) => {
      return await apiClient.put<EmailTemplate>(`/admin/email-templates/${data.id}`, data);
    }
  );
}

export function useDeleteEmailTemplate() {
  const apiClient = useApiClient();
  return useDelete<boolean>("email-templates", async (id) => {
    return await apiClient.delete<boolean>(`/admin/email-templates/${id}`);
  });
}
