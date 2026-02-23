export const settingsQueryKeys = {
  all: ["settings"] as const,
  detail: () => ["settings", "detail"] as const,
};
