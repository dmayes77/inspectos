/**
 * Agents data layer
 * Handles real estate agent CRUD operations
 */

import { shouldUseExternalApi } from "@/lib/api/feature-flags";
import { createApiClient } from "@/lib/api/client";

function getTenantSlug(): string {
  const isDevelopment =
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' ||
    process.env.NEXT_PUBLIC_IS_DEV_DEPLOYMENT === 'true';
  if (isDevelopment && process.env.NEXT_PUBLIC_SUPABASE_TENANT_ID) {
    return process.env.NEXT_PUBLIC_SUPABASE_TENANT_ID;
  }
  return "default";
}

export type AgentStatus = "active" | "inactive";
export type ReportFormat = "pdf" | "html" | "both";

export interface Agent {
  id: string;
  tenant_id: string;
  agency_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  license_number: string | null;
  magic_link_token: string | null;
  magic_link_expires_at: string | null;
  last_portal_access_at: string | null;
  status: AgentStatus;
  notes: string | null;
  preferred_report_format: ReportFormat;
  notify_on_schedule: boolean;
  notify_on_complete: boolean;
  notify_on_report: boolean;
  total_referrals: number;
  total_revenue: number;
  created_at: string;
  updated_at: string;
  // Expanded relations
  agency?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    website: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
  } | null;
  orders?: Array<{
    id: string;
    order_number: string;
    status: string;
    scheduled_date: string | null;
    total: number;
    property?: {
      address_line1: string;
      city: string;
      state: string;
    };
  }>;
  _count?: {
    orders: number;
  };
  avatar_url?: string | null;
  brand_logo_url?: string | null;
  agency_address?: string | null;
  agency_website?: string | null;
}

export interface CreateAgentInput {
  tenant_slug: string;
  agency_id?: string | null;
  agency_name?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  license_number?: string | null;
  role?: string | null;
  status?: AgentStatus;
  notes?: string | null;
  preferred_report_format?: ReportFormat;
  notify_on_schedule?: boolean;
  notify_on_complete?: boolean;
  notify_on_report?: boolean;
  avatar_url?: string | null;
  brand_logo_url?: string | null;
  agency_address?: string | null;
  agency_website?: string | null;
}

export interface UpdateAgentInput {
  id: string;
  agency_id?: string | null;
  agency_name?: string | null;
  name?: string;
  email?: string | null;
  phone?: string | null;
  license_number?: string | null;
  role?: string | null;
  status?: AgentStatus;
  notes?: string | null;
  preferred_report_format?: ReportFormat;
  notify_on_schedule?: boolean;
  notify_on_complete?: boolean;
  notify_on_report?: boolean;
  avatar_url?: string | null;
  brand_logo_url?: string | null;
  agency_address?: string | null;
}

export interface AgentFilters {
  status?: AgentStatus;
  agency_id?: string;
  search?: string;
}

export async function fetchAgents(filters?: AgentFilters): Promise<Agent[]> {
  if (shouldUseExternalApi("agents")) {
    // Use external central API
    const apiClient = createApiClient(getTenantSlug());
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.agency_id) params.append("agency_id", filters.agency_id);
    if (filters?.search) params.append("search", filters.search);
    const endpoint = params.toString() ? `/admin/agents?${params}` : "/admin/agents";
    return await apiClient.get<Agent[]>(endpoint);
  } else {
    // Use local Next.js API route
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.agency_id) params.append("agency_id", filters.agency_id);
    if (filters?.search) params.append("search", filters.search);
    const url = params.toString() ? `/api/admin/agents?${params}` : "/api/admin/agents";
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to fetch agents");
    }

    const result = await response.json();
    return result.data;
  }
}

export async function fetchAgentById(id: string): Promise<Agent> {
  if (shouldUseExternalApi("agents")) {
    // Use external central API
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.get<Agent>(`/admin/agents/${id}`);
  } else {
    // Use local Next.js API route
    const response = await fetch(`/api/admin/agents/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to fetch agent");
    }

    const result = await response.json();
    return result.data;
  }
}

export async function createAgent(input: CreateAgentInput): Promise<Agent> {
  if (shouldUseExternalApi("agents")) {
    // Use external central API
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.post<Agent>("/admin/agents", input);
  } else {
    // Use local Next.js API route
    const response = await fetch(`/api/admin/agents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to create agent");
    }

    const result = await response.json();
    return result.data;
  }
}

export async function updateAgent(input: UpdateAgentInput): Promise<Agent> {
  if (shouldUseExternalApi("agents")) {
    // Use external central API
    const apiClient = createApiClient(getTenantSlug());
    const { id, ...data } = input;
    return await apiClient.put<Agent>(`/admin/agents/${id}`, data);
  } else {
    // Use local Next.js API route
    const { id, ...data } = input;
    const response = await fetch(`/api/admin/agents/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to update agent");
    }

    const result = await response.json();
    return result.data;
  }
}

export async function deleteAgent(id: string): Promise<boolean> {
  if (shouldUseExternalApi("agents")) {
    // Use external central API
    const apiClient = createApiClient(getTenantSlug());
    const result = await apiClient.delete<{ deleted: boolean }>(`/admin/agents/${id}`);
    return result.deleted ?? true;
  } else {
    // Use local Next.js API route
    const response = await fetch(`/api/admin/agents/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to delete agent");
    }

    return true;
  }
}

export async function sendPortalLink(agentId: string): Promise<{ success: boolean; expires_at: string }> {
  const response = await fetch(`/api/admin/agents/${agentId}/send-portal-link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to send portal link");
  }

  return response.json();
}

export async function revokePortalAccess(agentId: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/admin/agents/${agentId}/revoke-portal-access`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to revoke portal access");
  }

  return response.json();
}
