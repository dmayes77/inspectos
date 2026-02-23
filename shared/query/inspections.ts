export const inspectionsQueryKeys = {
  all: ["inspections"] as const,
  lists: () => ["inspections", "list"] as const,
  list: () => ["inspections", "list"] as const,
  details: () => ["inspections", "detail"] as const,
  detail: (inspectionId: string) => ["inspections", "detail", inspectionId] as const,
};

export function isInspectionsQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === "inspections";
}
