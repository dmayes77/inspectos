export const workspacesQueryKeys = {
  all: ["workspaces"] as const,
  list: () => ["workspaces", "list"] as const,
};
