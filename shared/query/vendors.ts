export const vendorsQueryKeys = {
  all: ["vendors"] as const,
  list: () => ["vendors", "list"] as const,
  detail: (id: string) => ["vendors", "detail", id] as const,
};
