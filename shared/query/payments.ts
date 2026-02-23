export const paymentsQueryKeys = {
  all: ["payments"] as const,
  lists: () => ["payments", "list"] as const,
  list: () => ["payments", "list"] as const,
};

export function isPaymentsQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === "payments";
}
