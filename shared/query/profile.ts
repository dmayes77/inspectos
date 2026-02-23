export const profileQueryKeys = {
  all: ["profile"] as const,
  detail: () => ["profile", "detail"] as const,
};
