import type { PropertyFilters } from "../types/property";

export const propertiesQueryKeys = {
  all: ["properties"] as const,
  lists: () => ["properties", "list"] as const,
  list: (filters?: PropertyFilters) => ["properties", "list", filters ?? {}] as const,
  details: () => ["properties", "detail"] as const,
  detail: (propertyId: string) => ["properties", "detail", propertyId] as const,
};

export function isPropertiesQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === "properties";
}
