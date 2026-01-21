import type { Template } from "@/types/template";

export async function fetchTemplates(): Promise<Template[]> {
  const response = await fetch("/api/admin/templates");
  if (!response.ok) {
    throw new Error("Failed to load templates.");
  }
  return response.json();
}

export async function fetchTemplateById(id: string): Promise<Template | null> {
  const response = await fetch(`/api/admin/templates/${id}`);
  if (!response.ok) {
    return null;
  }
  return response.json();
}

export async function updateTemplate(id: string, data: Partial<Template>) {
  const response = await fetch(`/api/admin/templates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    let message = "Failed to update template.";
    try {
      const errorBody = await response.json();
      if (errorBody?.error) {
        message = errorBody.error;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
  return response.json();
}

export async function createTemplateStub(payload: { name: string; description?: string }) {
  const response = await fetch("/api/admin/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "create_stub", ...payload }),
  });
  if (!response.ok) {
    throw new Error("Failed to create template stub.");
  }
  return response.json();
}

export async function duplicateTemplate(id: string) {
  const response = await fetch(`/api/admin/templates/${id}/duplicate`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to duplicate template.");
  }
  return response.json();
}
