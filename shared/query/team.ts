export const teamQueryKeys = {
  all: ["team"] as const,
  list: () => ["team", "list"] as const,
  inspectors: () => ["inspectors"] as const,
};
