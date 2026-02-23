import type { AgencyFilters } from "../types/agency";

export const agenciesQueryKeys = {
  all: ["agencies"] as const,
  lists: () => ["agencies", "list"] as const,
  list: (filters?: AgencyFilters) => ["agencies", "list", filters ?? {}] as const,
  details: () => ["agencies", "detail"] as const,
  detail: (agencyId: string) => ["agencies", "detail", agencyId] as const,
};

export function isAgenciesQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === "agencies";
}
