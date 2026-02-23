export const workflowsQueryKeys = {
  all: ["workflows"] as const,
  list: () => ["workflows", "list"] as const,
};
