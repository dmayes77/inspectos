export const webhooksQueryKeys = {
  all: ["webhooks"] as const,
  list: () => ["webhooks", "list"] as const,
  detail: (id: string) => ["webhooks", "detail", id] as const,
};
