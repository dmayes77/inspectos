import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";

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
  tenant_slug?: string;
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

export function useAgents(filters?: AgentFilters) {
  const apiClient = useApiClient();
  return useGet<Agent[]>(
    `agents-${JSON.stringify(filters ?? {})}`,
    async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.agency_id) params.append("agency_id", filters.agency_id);
      if (filters?.search) params.append("search", filters.search);
      const endpoint = params.toString() ? `/admin/agents?${params}` : "/admin/agents";
      return await apiClient.get<Agent[]>(endpoint);
    }
  );
}

export function useAgentById(agentId: string) {
  const apiClient = useApiClient();
  return useGet<Agent | null>(
    `agent-${agentId}`,
    async () => {
      try {
        return await apiClient.get<Agent>(`/admin/agents/${agentId}`);
      } catch {
        return null;
      }
    },
    { enabled: !!agentId }
  );
}

export function useCreateAgent() {
  const apiClient = useApiClient();
  return usePost<Agent, CreateAgentInput>("agents", async (data) => {
    return await apiClient.post<Agent>('/admin/agents', data);
  });
}

export function useUpdateAgent() {
  const apiClient = useApiClient();
  return usePut<Agent, UpdateAgentInput>("agents", async (data) => {
    const { id, ...updateData } = data;
    return await apiClient.put<Agent>(`/admin/agents/${id}`, updateData);
  });
}

export function useDeleteAgent() {
  const apiClient = useApiClient();
  return useDelete<boolean>("agents", async (id: string) => {
    const result = await apiClient.delete<{ deleted: boolean }>(`/admin/agents/${id}`);
    return result.deleted ?? true;
  });
}

export function useSendAgentPortalLink() {
  const apiClient = useApiClient();
  return usePost<{ success: boolean; expires_at: string }, string>(
    "agents",
    async (agentId) => {
      return await apiClient.post<{ success: boolean; expires_at: string }>(`/admin/agents/${agentId}/send-portal-link`, {});
    }
  );
}
