import type { ApiClient } from "./client";
import type { Agent, AgentFilters, CreateAgentInput, UpdateAgentInput } from "../types/agent";

export function createAgentsApi(apiClient: ApiClient) {
  return {
    list: async (filters?: AgentFilters): Promise<Agent[]> => {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.agency_id) params.append("agency_id", filters.agency_id);
      if (filters?.search) params.append("search", filters.search);
      const endpoint = params.toString() ? `/admin/agents?${params}` : "/admin/agents";
      return apiClient.get<Agent[]>(endpoint);
    },
    getById: async (agentId: string): Promise<Agent> => {
      return apiClient.get<Agent>(`/admin/agents/${agentId}`);
    },
    create: async (data: CreateAgentInput): Promise<Agent> => {
      return apiClient.post<Agent>("/admin/agents", data);
    },
    update: async (data: UpdateAgentInput): Promise<Agent> => {
      const { id, ...updateData } = data;
      return apiClient.put<Agent>(`/admin/agents/${id}`, updateData);
    },
    remove: async (agentId: string): Promise<boolean> => {
      const result = await apiClient.delete<{ deleted: boolean }>(`/admin/agents/${agentId}`);
      return result.deleted ?? true;
    },
    sendPortalLink: async (
      agentId: string
    ): Promise<{ success: boolean; expires_at: string; link?: string; email_sent?: boolean; warning?: string }> => {
      return apiClient.post<{ success: boolean; expires_at: string; link?: string; email_sent?: boolean; warning?: string }>(
        `/admin/agents/${agentId}/send-portal-link`,
        {}
      );
    },
  };
}
