import { shouldUseExternalApi } from "@/lib/api/feature-flags";
import { createApiClient } from "@/lib/api/client";

export type LeadRecord = {
  leadId: string;
  name: string;
  email: string;
  phone: string;
  stage: string;
  source: string;
  notes: string;
  serviceName: string;
  requestedDate: string;
  estimatedValue: number;
};

/**
 * Get tenant slug from environment
 * TODO: In production, this should come from user session or URL
 */
function getTenantSlug(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_TENANT_ID || "default";
}

export async function fetchLeads(): Promise<LeadRecord[]> {
  if (shouldUseExternalApi("leads")) {
    // Use external central API
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.get<LeadRecord[]>("/admin/leads");
  } else {
    // Use local Next.js API route
    const response = await fetch("/api/admin/leads");
    if (!response.ok) {
      throw new Error("Failed to load leads.");
    }
    const result = await response.json();
    return Array.isArray(result) ? result : (result.data ?? []);
  }
}

export async function fetchLeadById(leadId: string): Promise<LeadRecord | null> {
  if (shouldUseExternalApi("leads")) {
    // Use external central API
    try {
      const apiClient = createApiClient(getTenantSlug());
      return await apiClient.get<LeadRecord>(`/admin/leads/${leadId}`);
    } catch (error) {
      // Handle 404 as null
      return null;
    }
  } else {
    // Use local Next.js API route
    const response = await fetch(`/api/admin/leads/${leadId}`);
    if (!response.ok) {
      return null;
    }
    const result = await response.json();
    return (result.data ?? result) as LeadRecord;
  }
}

export async function createLead(data: Partial<LeadRecord>): Promise<LeadRecord> {
  if (shouldUseExternalApi("leads")) {
    // Use external central API
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.post<LeadRecord>("/admin/leads", data);
  } else {
    // Use local Next.js API route
    const response = await fetch("/api/admin/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.error ?? "Failed to create lead.");
    }
    const result = await response.json();
    return result.data;
  }
}

export async function updateLeadById(data: { leadId: string } & Partial<LeadRecord>): Promise<LeadRecord | null> {
  if (shouldUseExternalApi("leads")) {
    // Use external central API
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.put<LeadRecord>(`/admin/leads/${data.leadId}`, data);
  } else {
    // Use local Next.js API route
    const response = await fetch(`/api/admin/leads/${data.leadId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.error ?? "Failed to update lead.");
    }
    const result = await response.json();
    return result.data;
  }
}

export async function deleteLeadById(leadId: string): Promise<boolean> {
  if (shouldUseExternalApi("leads")) {
    // Use external central API
    const apiClient = createApiClient(getTenantSlug());
    const result = await apiClient.delete<{ deleted: boolean }>(`/admin/leads/${leadId}`);
    return result.deleted ?? true;
  } else {
    // Use local Next.js API route
    const response = await fetch(`/api/admin/leads/${leadId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.error ?? "Failed to delete lead.");
    }
    const result = await response.json();
    return result.data;
  }
}
