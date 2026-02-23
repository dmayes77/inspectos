export const leadsQueryKeys = {
  all: ["leads"] as const,
  list: () => ["leads", "list"] as const,
  detail: (leadId: string) => ["leads", "detail", leadId] as const,
};
