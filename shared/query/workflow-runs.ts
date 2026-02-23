export const workflowRunsQueryKeys = {
  all: ["workflow-runs"] as const,
  list: () => ["workflow-runs", "list"] as const,
};
