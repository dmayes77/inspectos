export const integrationsQueryKeys = {
  all: ["integrations"] as const,
  list: () => ["integrations", "list"] as const,
};
