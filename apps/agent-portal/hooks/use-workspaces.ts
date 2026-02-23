"use client";

import { useQuery } from "@tanstack/react-query";
import { workspacesQueryKeys } from "@inspectos/shared/query";
import type { Workspace } from "@inspectos/shared/types/workspace";
import { createApiClient } from "@/lib/api/client";

export function useWorkspaces() {
  return useQuery<Workspace[]>({
    queryKey: workspacesQueryKeys.list(),
    queryFn: async () => {
      const apiClient = createApiClient();
      const response = await apiClient.get<{ workspaces: Workspace[] }>("/agent-portal/workspaces");
      return response.workspaces ?? [];
    },
    retry: false,
  });
}
