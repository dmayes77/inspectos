export type PlanCode = "growth" | "team";

export type PlanDefaults = {
  code: PlanCode;
  name: string;
  baseMonthlyPrice: number;
  includedInspectors: number;
  maxInspectors: number;
  additionalInspectorPrice: number;
};

export const BILLING_PLAN_DEFAULTS: Record<PlanCode, PlanDefaults> = {
  growth: {
    code: "growth",
    name: "Growth",
    baseMonthlyPrice: 399,
    includedInspectors: 1,
    maxInspectors: 5,
    additionalInspectorPrice: 89,
  },
  team: {
    code: "team",
    name: "Team",
    baseMonthlyPrice: 1290,
    includedInspectors: 5,
    maxInspectors: 15,
    additionalInspectorPrice: 79,
  },
};

export const STRIPE_BASE_PRICE_ENV_BY_PLAN: Record<PlanCode, string> = {
  growth: "STRIPE_PRICE_ID_GROWTH",
  team: "STRIPE_PRICE_ID_TEAM",
};

export const STRIPE_SEAT_PRICE_ENV_BY_PLAN: Record<PlanCode, string> = {
  growth: "STRIPE_PRICE_ID_GROWTH_SEAT",
  team: "STRIPE_PRICE_ID_TEAM_SEAT",
};

export function normalizePlanCode(value: unknown): PlanCode | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "growth" || normalized === "team") {
    return normalized;
  }
  return null;
}
