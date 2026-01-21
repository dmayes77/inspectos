import type { Workflow } from "@/types/workflow";

export async function fetchWorkflows(): Promise<Workflow[]> {
  const response = await fetch("/api/admin/workflows");
  if (!response.ok) {
    throw new Error("Failed to load workflows.");
  }
  return response.json();
}

export async function createWorkflow(data: Partial<Workflow>): Promise<Workflow> {
  const response = await fetch("/api/admin/workflows", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create workflow.");
  }
  return response.json();
}

export async function updateWorkflow(id: string, data: Partial<Workflow>): Promise<Workflow> {
  const response = await fetch(`/api/admin/workflows/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update workflow.");
  }
  return response.json();
}

export async function deleteWorkflow(id: string): Promise<boolean> {
  const response = await fetch(`/api/admin/workflows/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete workflow.");
  }
  return response.json();
}
