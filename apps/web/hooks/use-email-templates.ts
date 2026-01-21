import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import { fetchEmailTemplates, createEmailTemplate, updateEmailTemplate, deleteEmailTemplate } from "@/lib/data/email-templates";
import type { EmailTemplate } from "@/types/email-template";

export function useEmailTemplates() {
  return useGet<EmailTemplate[]>("email-templates", async () => fetchEmailTemplates());
}

export function useCreateEmailTemplate() {
  return usePost<EmailTemplate, Partial<EmailTemplate>>("email-templates", async (data) => createEmailTemplate(data));
}

export function useUpdateEmailTemplate() {
  return usePut<EmailTemplate, { id: string } & Partial<EmailTemplate>>(
    "email-templates",
    async (data) => updateEmailTemplate(data.id, data)
  );
}

export function useDeleteEmailTemplate() {
  return useDelete<boolean>("email-templates", async (id) => deleteEmailTemplate(id));
}
