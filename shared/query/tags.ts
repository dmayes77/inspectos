export const tagsQueryKeys = {
  all: ["tags"] as const,
  list: () => ["tags", "list"] as const,
};
