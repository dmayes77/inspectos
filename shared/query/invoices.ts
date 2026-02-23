export const invoicesQueryKeys = {
  all: ["invoices"] as const,
  lists: () => ["invoices", "list"] as const,
  list: () => ["invoices", "list"] as const,
  details: () => ["invoices", "detail"] as const,
  detail: (invoiceId: string) => ["invoices", "detail", invoiceId] as const,
};

export function isInvoicesQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === "invoices";
}
