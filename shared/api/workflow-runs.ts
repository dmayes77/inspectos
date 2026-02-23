import type { ApiClient } from "./client";

export function createWorkflowRunsApi(apiClient: ApiClient) {
  return {
    list: <T>() => apiClient.get<T[]>("/admin/workflow-runs"),
  };
}
