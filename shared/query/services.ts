export const servicesQueryKeys = {
  all: ["services"] as const,
  lists: () => ["services", "list"] as const,
  list: () => ["services", "list"] as const,
};

export function isServicesQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === "services";
}
