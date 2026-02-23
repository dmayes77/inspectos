export const clientsQueryKeys = {
  all: ["clients"] as const,
  lists: () => ["clients", "list"] as const,
  list: () => ["clients", "list"] as const,
  details: () => ["clients", "detail"] as const,
  detail: (clientId: string) => ["clients", "detail", clientId] as const,
};
