import type { EmailTemplate } from "@/types/email-template";

export async function fetchEmailTemplates(): Promise<EmailTemplate[]> {
  const response = await fetch("/api/admin/email-templates");
  if (!response.ok) {
    throw new Error("Failed to load email templates.");
  }
  return response.json();
}

export async function createEmailTemplate(data: Partial<EmailTemplate>): Promise<EmailTemplate> {
  const response = await fetch("/api/admin/email-templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create email template.");
  }
  return response.json();
}

export async function updateEmailTemplate(id: string, data: Partial<EmailTemplate>): Promise<EmailTemplate> {
  const response = await fetch(`/api/admin/email-templates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update email template.");
  }
  return response.json();
}

export async function deleteEmailTemplate(id: string): Promise<boolean> {
  const response = await fetch(`/api/admin/email-templates/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete email template.");
  }
  return response.json();
}
