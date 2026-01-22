import type { Inspection, LegacyInspection } from "@/types/inspection";
import type { Client } from "@/hooks/use-clients";
import type { TeamMember } from "@/hooks/use-team";
import type { Service } from "@/hooks/use-services";
import {
  getTeamMembers,
  createTeamMember as createMockTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from "@/lib/mock/team";

export async function fetchInspections(): Promise<Inspection[]> {
  const response = await fetch("/api/admin/inspections");
  if (!response.ok) {
    throw new Error("Failed to load inspections.");
  }
  const result = await response.json();
  return Array.isArray(result) ? result : (result.data ?? []);
}

export async function fetchInspectionById(inspectionId: string): Promise<LegacyInspection | null> {
  const response = await fetch(`/api/admin/inspections/${inspectionId}`);
  if (!response.ok) return null;
  const result = await response.json();
  return (result.data ?? result) as LegacyInspection;
}

export async function createInspection(data: Record<string, unknown>): Promise<Inspection> {
  const response = await fetch("/api/admin/inspections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error ?? "Failed to create inspection.");
  }
  const result = await response.json();
  return result.data;
}

export async function updateInspectionById(
  data: { inspectionId: string } & Record<string, unknown>
): Promise<Inspection | null> {
  const response = await fetch(`/api/admin/inspections/${data.inspectionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error ?? "Failed to update inspection.");
  }
  const result = await response.json();
  return result.data;
}

export async function deleteInspectionById(inspectionId: string): Promise<boolean> {
  const response = await fetch(`/api/admin/inspections/${inspectionId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error ?? "Failed to delete inspection.");
  }
  const result = await response.json();
  return result.data;
}

export async function fetchClients(): Promise<Client[]> {
  const response = await fetch("/api/admin/clients");
  if (!response.ok) {
    throw new Error("Failed to load clients.");
  }
  const result = await response.json();
  return Array.isArray(result) ? result : (result.data ?? []);
}

export async function fetchClientById(clientId: string): Promise<Client | null> {
  const response = await fetch(`/api/admin/clients/${clientId}`);
  if (!response.ok) {
    return null;
  }
  const result = await response.json();
  return (result.data ?? result) as Client;
}

export async function createClient(data: Omit<Client, "clientId" | "archived">): Promise<Client> {
  const response = await fetch("/api/admin/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error ?? "Failed to create client.");
  }
  const result = await response.json();
  return result.data;
}

export async function updateClientById(data: { clientId: string } & Partial<Client>): Promise<Client | null> {
  const response = await fetch(`/api/admin/clients/${data.clientId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error ?? "Failed to update client.");
  }
  const result = await response.json();
  return result.data;
}

export async function deleteClientById(clientId: string): Promise<boolean> {
  const response = await fetch(`/api/admin/clients/${clientId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error ?? "Failed to delete client.");
  }
  const result = await response.json();
  return result.data;
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  return Promise.resolve(getTeamMembers());
}

export async function createTeamMember(data: Partial<TeamMember>): Promise<TeamMember> {
  return Promise.resolve(createMockTeamMember(data));
}

export async function updateTeamMemberById(
  data: { teamMemberId: string } & Partial<TeamMember>
): Promise<TeamMember | null> {
  return Promise.resolve(updateTeamMember(data.teamMemberId, data));
}

export async function deleteTeamMemberById(teamMemberId: string): Promise<boolean> {
  return Promise.resolve(deleteTeamMember(teamMemberId));
}

export async function fetchServices(): Promise<Service[]> {
  const response = await fetch("/api/admin/services");
  if (!response.ok) {
    throw new Error("Failed to load services.");
  }
  const result = await response.json();
  return Array.isArray(result) ? result : (result.data ?? []);
}

export async function fetchInspectors(): Promise<{ teamMemberId: string; name: string }[]> {
  const response = await fetch("/api/admin/inspectors");
  if (!response.ok) {
    throw new Error("Failed to load inspectors.");
  }
  const result = await response.json();
  return Array.isArray(result) ? result : (result.data ?? []);
}

export async function createService(data: Partial<Service>): Promise<Service> {
  const response = await fetch("/api/admin/services", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create service.");
  }
  const result = await response.json();
  return result.data;
}

export async function updateServiceById(data: { serviceId: string } & Partial<Service>): Promise<Service | null> {
  const response = await fetch(`/api/admin/services/${data.serviceId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update service.");
  }
  const result = await response.json();
  return result.data;
}

export async function deleteServiceById(serviceId: string): Promise<boolean> {
  const response = await fetch(`/api/admin/services/${serviceId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to archive service.");
  }
  const result = await response.json();
  return result.data;
}
