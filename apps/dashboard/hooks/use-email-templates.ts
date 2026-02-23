import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import type { EmailTemplate } from "@/types/email-template";
import { useApiClient } from "@/lib/api/tenant-context";
import { createEmailTemplatesApi } from "@inspectos/shared/api";
import { emailTemplatesQueryKeys } from "@inspectos/shared/query";

export function useEmailTemplates() {
  const apiClient = useApiClient();
  const emailTemplatesApi = createEmailTemplatesApi(apiClient);
  return useGet<EmailTemplate[]>(emailTemplatesQueryKeys.all, async () => {
    return await emailTemplatesApi.list<EmailTemplate>();
  });
}

export function useCreateEmailTemplate() {
  const apiClient = useApiClient();
  const emailTemplatesApi = createEmailTemplatesApi(apiClient);
  return usePost<EmailTemplate, Partial<EmailTemplate>>(emailTemplatesQueryKeys.all, async (data) => {
    return await emailTemplatesApi.create<EmailTemplate>(data);
  });
}

export function useUpdateEmailTemplate() {
  const apiClient = useApiClient();
  const emailTemplatesApi = createEmailTemplatesApi(apiClient);
  return usePut<EmailTemplate, { id: string } & Partial<EmailTemplate>>(
    emailTemplatesQueryKeys.all,
    async (data) => {
      return await emailTemplatesApi.update<EmailTemplate>(data.id, data);
    }
  );
}

export function useDeleteEmailTemplate() {
  const apiClient = useApiClient();
  const emailTemplatesApi = createEmailTemplatesApi(apiClient);
  return useDelete<boolean>(emailTemplatesQueryKeys.all, async (id) => {
    return await emailTemplatesApi.remove<boolean>(id);
  });
}
