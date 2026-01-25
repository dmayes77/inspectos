/**
 * Agencies data layer
 * Handles real estate agency CRUD operations
 */

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
  tenant_slug: string;
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

export async function fetchAgencies(tenantSlug: string, filters?: AgencyFilters): Promise<Agency[]> {
  const params = new URLSearchParams({ tenant: tenantSlug });

  if (filters?.status) params.append("status", filters.status);
  if (filters?.search) params.append("search", filters.search);

  const response = await fetch(`/api/admin/agencies?${params}`, {
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

export async function fetchAgencyById(id: string): Promise<Agency> {
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

export async function createAgency(input: CreateAgencyInput): Promise<Agency> {
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

export async function updateAgency(input: UpdateAgencyInput): Promise<Agency> {
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

export async function deleteAgency(id: string): Promise<boolean> {
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
