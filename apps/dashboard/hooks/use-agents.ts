import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";
import { createAgentsApi } from "@inspectos/shared/api";
import { agentsQueryKeys } from "@inspectos/shared/query";
import type {
  Agent,
  AgentFilters,
  AgentStatus,
  CreateAgentInput,
  ReportFormat,
  UpdateAgentInput,
} from "@inspectos/shared/types/agent";

export type { Agent, AgentFilters, AgentStatus, CreateAgentInput, ReportFormat, UpdateAgentInput };

export function useAgents(filters?: AgentFilters) {
  const apiClient = useApiClient();
  const agentsApi = createAgentsApi(apiClient);
  return useGet<Agent[]>(
    agentsQueryKeys.list(filters),
    async () => {
      return await agentsApi.list(filters);
    }
  );
}

export function useAgentById(agentId: string) {
  const apiClient = useApiClient();
  const agentsApi = createAgentsApi(apiClient);
  return useGet<Agent | null>(
    agentsQueryKeys.detail(agentId),
    async () => {
      try {
        return await agentsApi.getById(agentId);
      } catch {
        return null;
      }
    },
    { enabled: !!agentId }
  );
}

export function useCreateAgent() {
  const apiClient = useApiClient();
  const agentsApi = createAgentsApi(apiClient);
  return usePost<Agent, CreateAgentInput>(agentsQueryKeys.all, async (data) => {
    return await agentsApi.create(data);
  });
}

export function useUpdateAgent() {
  const apiClient = useApiClient();
  const agentsApi = createAgentsApi(apiClient);
  return usePut<Agent, UpdateAgentInput>(agentsQueryKeys.all, async (data) => {
    return await agentsApi.update(data);
  });
}

export function useDeleteAgent() {
  const apiClient = useApiClient();
  const agentsApi = createAgentsApi(apiClient);
  return useDelete<boolean>(agentsQueryKeys.all, async (id: string) => {
    return await agentsApi.remove(id);
  });
}

export function useSendAgentPortalLink() {
  const apiClient = useApiClient();
  const agentsApi = createAgentsApi(apiClient);
  return usePost<{ success: boolean; expires_at: string }, string>(
    agentsQueryKeys.all,
    async (agentId) => {
      return await agentsApi.sendPortalLink(agentId);
    }
  );
}
