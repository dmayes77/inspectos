export const payoutsQueryKeys = {
  all: ["payouts"] as const,
  list: () => ["payouts", "list"] as const,
  payRules: () => ["pay-rules"] as const,
};
