export const ordersQueryKeys = {
  all: ["orders"] as const,
  lists: () => ["orders", "list"] as const,
  list: (tenantSlug: string = "demo", filters?: unknown) =>
    ["orders", "list", tenantSlug, filters ?? null] as const,
  details: () => ["orders", "detail"] as const,
  detail: (orderId: string) => ["orders", "detail", orderId] as const,
};

export function isOrdersQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === "orders";
}
