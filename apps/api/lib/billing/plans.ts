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
    baseMonthlyPrice: 499,
    includedInspectors: 1,
    maxInspectors: 5,
    additionalInspectorPrice: 99,
  },
  team: {
    code: "team",
    name: "Team",
    baseMonthlyPrice: 799,
    includedInspectors: 5,
    maxInspectors: 15,
    additionalInspectorPrice: 79,
  },
};

export const STRIPE_BASE_PRICE_ENV_BY_PLAN: Record<PlanCode, string> = {
  growth: "STRIPE_BASE_PRICE_GROWTH",
  team: "STRIPE_BASE_PRICE_TEAM",
};

export const STRIPE_SEAT_PRICE_ENV_BY_PLAN: Record<PlanCode, string> = {
  growth: "STRIPE_SEAT_PRICE_GROWTH",
  team: "STRIPE_SEAT_PRICE_TEAM",
};

export function normalizePlanCode(value: unknown): PlanCode | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "growth" || normalized === "team") {
    return normalized;
  }
  return null;
}
