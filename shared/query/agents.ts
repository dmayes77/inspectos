import type { AgentFilters } from "../types/agent";

export const agentsQueryKeys = {
  all: ["agents"] as const,
  lists: () => ["agents", "list"] as const,
  list: (filters?: AgentFilters) => ["agents", "list", filters ?? {}] as const,
  details: () => ["agents", "detail"] as const,
  detail: (agentId: string) => ["agents", "detail", agentId] as const,
};

export function isAgentsQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === "agents";
}
