export const scheduleQueryKeys = {
  all: ["schedule"] as const,
  list: (from?: string, to?: string) => ["schedule", from ?? null, to ?? null] as const,
};
