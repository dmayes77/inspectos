import type { Inspection, LegacyInspection } from "@/types/inspection";
import type { Client } from "@/hooks/use-clients";
import type { TeamMember } from "@/hooks/use-team";
import type { Service } from "@/hooks/use-services";
import { shouldUseExternalApi } from "@/lib/api/feature-flags";
import { createApiClient } from "@/lib/api/client";

/**
 * Get tenant slug from environment
 * TODO: In production, this should come from user session or URL
 */
function getTenantSlug(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_TENANT_ID || "default";
}

export async function fetchInspections(): Promise<Inspection[]> {
  const response = await fetch("/api/admin/inspections");
  if (!response.ok) {
    throw new Error("Failed to load inspections.");
  }
  const result = await response.json();
  const normalized = Array.isArray(result) ? result : Array.isArray(result?.data) ? (result.data as Inspection[]) : [];
  console.log("[fetchInspections] received", {
    ok: response.ok,
    status: response.status,
    length: normalized.length,
    rawType: Array.isArray(result) ? "array" : typeof result,
    tenantId: (result?.tenantId as string) ?? "unknown",
  });
  return normalized;
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

export async function updateInspectionById(data: { inspectionId: string } & Record<string, unknown>): Promise<Inspection | null> {
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
  if (shouldUseExternalApi("clients")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.get<Client[]>("/admin/clients");
  } else {
    const response = await fetch("/api/admin/clients");
    if (!response.ok) {
      throw new Error("Failed to load clients.");
    }
    const result = await response.json();
    return Array.isArray(result) ? result : (result.data ?? []);
  }
}

export async function fetchClientById(clientId: string): Promise<Client | null> {
  if (shouldUseExternalApi("clients")) {
    try {
      const apiClient = createApiClient(getTenantSlug());
      return await apiClient.get<Client>(`/admin/clients/${clientId}`);
    } catch {
      return null;
    }
  } else {
    const response = await fetch(`/api/admin/clients/${clientId}`);
    if (!response.ok) {
      return null;
    }
    const result = await response.json();
    return (result.data ?? result) as Client;
  }
}

export async function createClient(data: Omit<Client, "clientId" | "archived">): Promise<Client> {
  if (shouldUseExternalApi("clients")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.post<Client>("/admin/clients", data);
  } else {
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
}

export async function updateClientById(data: { clientId: string } & Partial<Client>): Promise<Client | null> {
  if (shouldUseExternalApi("clients")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.put<Client>(`/admin/clients/${data.clientId}`, data);
  } else {
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
}

export async function deleteClientById(clientId: string): Promise<boolean> {
  if (shouldUseExternalApi("clients")) {
    const apiClient = createApiClient(getTenantSlug());
    const result = await apiClient.delete<{ deleted: boolean }>(`/admin/clients/${clientId}`);
    return result.deleted ?? true;
  } else {
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
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const response = await fetch("/api/admin/team");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || "Failed to load team members.");
  }
  const result = await response.json();
  return result.data ?? [];
}

export async function createTeamMember(data: Partial<TeamMember>): Promise<TeamMember> {
  const response = await fetch("/api/admin/team", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || "Failed to create team member.");
  }
  const result = await response.json();
  return {
    id: result.data?.user_id ?? "",
    teamMemberId: result.data?.user_id ?? "",
    avatarUrl: data.avatarUrl,
    name: data.name ?? "",
    email: data.email ?? "",
    phone: data.phone ?? "",
    role: data.role ?? "INSPECTOR",
    status: data.status ?? "active",
    location: data.location ?? "",
    inspections: data.inspections ?? 0,
    rating: data.rating ?? null,
    certifications: data.certifications ?? [],
    joinedDate: data.joinedDate ?? "",
    customPermissions: data.customPermissions ?? [],
  };
}

export async function updateTeamMemberById(data: { teamMemberId: string } & Partial<TeamMember>): Promise<TeamMember | null> {
  const memberId = data.teamMemberId?.trim();
  if (!memberId || memberId === "undefined") {
    throw new Error("Missing team member id.");
  }
  if (!/^[0-9a-fA-F-]{36}$/.test(memberId)) {
    throw new Error("Invalid team member id.");
  }
  const response = await fetch(`/api/admin/team/${memberId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || "Failed to update team member.");
  }
  return data as TeamMember;
}

export async function deleteTeamMemberById(teamMemberId: string): Promise<boolean> {
  const response = await fetch(`/api/admin/team/${teamMemberId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || "Failed to delete team member.");
  }
  return true;
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
