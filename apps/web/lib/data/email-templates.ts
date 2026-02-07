import type { EmailTemplate } from "@/types/email-template";
import { shouldUseExternalApi } from "@/lib/api/feature-flags";
import { createApiClient } from "@/lib/api/client";

function getTenantSlug(): string {
  const isDevelopment =
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' ||
    process.env.NEXT_PUBLIC_IS_DEV_DEPLOYMENT === 'true';
  if (typeof window !== "undefined") {
    const pathParts = window.location.pathname.split("/");
    return pathParts[1] || "default";
  }
  return "default";
}

export async function fetchEmailTemplates(): Promise<EmailTemplate[]> {
  if (shouldUseExternalApi("emailTemplates")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.get<EmailTemplate[]>("/admin/email-templates");
  } else {
    const response = await fetch("/api/admin/email-templates");
    if (!response.ok) {
      throw new Error("Failed to load email templates.");
    }
    return response.json();
  }
}

export async function createEmailTemplate(data: Partial<EmailTemplate>): Promise<EmailTemplate> {
  if (shouldUseExternalApi("emailTemplates")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.post<EmailTemplate>("/admin/email-templates", data);
  } else {
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
}

export async function updateEmailTemplate(id: string, data: Partial<EmailTemplate>): Promise<EmailTemplate> {
  if (shouldUseExternalApi("emailTemplates")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.put<EmailTemplate>(`/admin/email-templates/${id}`, data);
  } else {
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
}

export async function deleteEmailTemplate(id: string): Promise<boolean> {
  if (shouldUseExternalApi("emailTemplates")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.delete<boolean>(`/admin/email-templates/${id}`);
  } else {
    const response = await fetch(`/api/admin/email-templates/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete email template.");
    }
    return response.json();
  }
}
