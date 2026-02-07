/**
 * Agencies data layer
 * Handles real estate agency CRUD operations
 */

import { shouldUseExternalApi } from "@/lib/api/feature-flags";
import { createApiClient } from "@/lib/api/client";

function getTenantSlug(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_TENANT_ID || "default";
}

export type AgencyStatus = "active" | "inactive";

export interface Agency {
  id: string;
  tenant_id: string;
  name: string;
  logo_url: string | null;
  license_number: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  status: AgencyStatus;
  notes: string | null;
  total_referrals: number;
  total_revenue: number;
  created_at: string;
  updated_at: string;
  // Expanded relations
  agents?: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    status: string;
    total_referrals: number;
  }>;
  _count?: {
    agents: number;
    orders: number;
  };
}

export interface CreateAgencyInput {
  name: string;
  logo_url?: string | null;
  license_number?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  status?: AgencyStatus;
  notes?: string | null;
}

export interface UpdateAgencyInput {
  id: string;
  name?: string;
  logo_url?: string | null;
  license_number?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  status?: AgencyStatus;
  notes?: string | null;
}

export interface AgencyFilters {
  status?: AgencyStatus;
  search?: string;
}

export async function fetchAgencies(filters?: AgencyFilters): Promise<Agency[]> {
  if (shouldUseExternalApi("agencies")) {
    // Use external central API
    const apiClient = createApiClient(getTenantSlug());
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.search) params.append("search", filters.search);
    const endpoint = params.toString() ? `/admin/agencies?${params}` : "/admin/agencies";
    return await apiClient.get<Agency[]>(endpoint);
  } else {
    // Use local Next.js API route
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.search) params.append("search", filters.search);
    const url = params.toString() ? `/api/admin/agencies?${params}` : "/api/admin/agencies";
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to fetch agencies");
    }

    const result = await response.json();
    return result.data;
  }
}

export async function fetchAgencyById(id: string): Promise<Agency> {
  if (shouldUseExternalApi("agencies")) {
    // Use external central API
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.get<Agency>(`/admin/agencies/${id}`);
  } else {
    // Use local Next.js API route
    const response = await fetch(`/api/admin/agencies/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to fetch agency");
    }

    const result = await response.json();
    return result.data;
  }
}

export async function createAgency(input: CreateAgencyInput): Promise<Agency> {
  if (shouldUseExternalApi("agencies")) {
    // Use external central API
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.post<Agency>("/admin/agencies", input);
  } else {
    // Use local Next.js API route
    const response = await fetch(`/api/admin/agencies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to create agency");
    }

    const result = await response.json();
    return result.data;
  }
}

export async function updateAgency(input: UpdateAgencyInput): Promise<Agency> {
  if (shouldUseExternalApi("agencies")) {
    // Use external central API
    const apiClient = createApiClient(getTenantSlug());
    const { id, ...data } = input;
    return await apiClient.put<Agency>(`/admin/agencies/${id}`, data);
  } else {
    // Use local Next.js API route
    const { id, ...data } = input;
    const response = await fetch(`/api/admin/agencies/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to update agency");
    }

    const result = await response.json();
    return result.data;
  }
}

export async function deleteAgency(id: string): Promise<boolean> {
  if (shouldUseExternalApi("agencies")) {
    // Use external central API
    const apiClient = createApiClient(getTenantSlug());
    const result = await apiClient.delete<{ deleted: boolean }>(`/admin/agencies/${id}`);
    return result.deleted ?? true;
  } else {
    // Use local Next.js API route
    const response = await fetch(`/api/admin/agencies/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to delete agency");
    }

    return true;
  }
}
