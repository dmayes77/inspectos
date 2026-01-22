import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import {
  fetchAgents,
  fetchAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
  sendPortalLink,
  type Agent,
  type CreateAgentInput,
  type UpdateAgentInput,
  type AgentFilters,
} from "@/lib/data/agents";

export type { Agent, CreateAgentInput, UpdateAgentInput, AgentFilters };

export function useAgents(tenantSlug: string = "demo", filters?: AgentFilters) {
  return useGet<Agent[]>(
    `agents-${tenantSlug}-${JSON.stringify(filters ?? {})}`,
    async () => fetchAgents(tenantSlug, filters)
  );
}

export function useAgentById(agentId: string) {
  return useGet<Agent | null>(
    `agent-${agentId}`,
    async () => {
      try {
        return await fetchAgentById(agentId);
      } catch {
        return null;
      }
    },
    { enabled: !!agentId }
  );
}

export function useCreateAgent() {
  return usePost<Agent, CreateAgentInput>("agents", async (data) => createAgent(data));
}

export function useUpdateAgent() {
  return usePut<Agent, UpdateAgentInput>("agents", async (data) => updateAgent(data));
}

export function useDeleteAgent() {
  return useDelete<boolean>("agents", async (id: string) => deleteAgent(id));
}

export function useSendAgentPortalLink() {
  return usePost<{ success: boolean; expires_at: string }, string>(
    "agents",
    async (agentId) => sendPortalLink(agentId)
  );
}
