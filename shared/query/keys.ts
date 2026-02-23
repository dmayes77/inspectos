export function createEntityQueryKeys(resource: string) {
  return {
    all: [resource] as const,
    lists: () => [resource, "list"] as const,
    list: <TParams>(params?: TParams) => [resource, "list", params ?? {}] as const,
    details: () => [resource, "detail"] as const,
    detail: (id: string | number) => [resource, "detail", id] as const,
  };
}
