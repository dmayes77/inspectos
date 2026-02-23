export const agencyLookupQueryKeys = {
  all: ["agency-lookup"] as const,
  search: (query: string) => ["agency-lookup", "search", query] as const,
};
