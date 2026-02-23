import type { ApiClient } from "./client";
import type { WorkspacesResponse } from "../types/workspace";

export function createWorkspacesApi(apiClient: ApiClient) {
  return {
    list: async (): Promise<WorkspacesResponse["workspaces"]> => {
      const response = await apiClient.get<WorkspacesResponse>("/auth/workspaces");
      return response.workspaces ?? [];
    },
  };
}
