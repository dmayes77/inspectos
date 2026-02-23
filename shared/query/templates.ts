export const templatesQueryKeys = {
  all: ["templates"] as const,
  list: () => ["templates", "list"] as const,
  detail: (id: string) => ["templates", "detail", id] as const,
};
