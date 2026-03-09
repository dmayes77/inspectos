"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PlanId = "growth" | "team";

type PlanConfig = {
  id: PlanId;
  label: string;
  baseMonthly: number;
  includedSeats: number;
  maxSeats: number;
  additionalSeatMonthly: number;
};

const PLAN_CONFIG: Record<PlanId, PlanConfig> = {
  growth: {
    id: "growth",
    label: "Growth",
    baseMonthly: 499,
    includedSeats: 1,
    maxSeats: 5,
    additionalSeatMonthly: 99,
  },
  team: {
    id: "team",
    label: "Team",
    baseMonthly: 799,
    includedSeats: 5,
    maxSeats: 15,
    additionalSeatMonthly: 79,
  },
};

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export function PricingCalculator() {
  const [planId, setPlanId] = useState<PlanId>("growth");
  const plan = PLAN_CONFIG[planId];
  const [seats, setSeats] = useState<number>(plan.includedSeats);

  const additionalSeats = Math.max(0, seats - plan.includedSeats);
  const monthlyTotal = plan.baseMonthly + additionalSeats * plan.additionalSeatMonthly;
  const yearlyTotal = monthlyTotal * 12;

  const helper = useMemo(() => {
    if (additionalSeats === 0) {
      return `${plan.includedSeats} included seat${plan.includedSeats === 1 ? "" : "s"} in ${plan.label}.`;
    }
    return `${additionalSeats} additional seat${additionalSeats === 1 ? "" : "s"} x ${money(plan.additionalSeatMonthly)}/mo.`;
  }, [additionalSeats, plan]);

  const changePlan = (next: PlanId) => {
    const nextPlan = PLAN_CONFIG[next];
    setPlanId(next);
    setSeats(nextPlan.includedSeats);
  };

  return (
    <Card className="mx-auto mb-12 max-w-3xl">
      <CardHeader>
        <CardTitle className="text-xl">Estimate Your Monthly Cost</CardTitle>
        <CardDescription>Use the slider to estimate plan pricing by active inspector seats.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-2 sm:grid-cols-2">
          {(["growth", "team"] as PlanId[]).map((id) => {
            const option = PLAN_CONFIG[id];
            const selected = id === planId;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => changePlan(option.id)}
                className={`rounded-sm border px-4 py-3 text-left transition-colors ${
                  selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                }`}
              >
                <p className="text-sm font-semibold">{option.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {money(option.baseMonthly)}/mo base · up to {option.maxSeats} seats
                </p>
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Inspector seats</p>
            <p className="text-sm font-semibold">{seats}</p>
          </div>
          <input
            type="range"
            min={plan.includedSeats}
            max={plan.maxSeats}
            value={seats}
            onChange={(event) => setSeats(Number(event.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{plan.includedSeats} included</span>
            <span>{plan.maxSeats} max</span>
          </div>
        </div>

        <div className="rounded-sm border bg-muted/20 p-4">
          <div className="grid gap-1 sm:grid-cols-2">
            <p className="text-sm text-muted-foreground">Estimated monthly total</p>
            <p className="text-right text-lg font-semibold">{money(monthlyTotal)}</p>
            <p className="text-sm text-muted-foreground">Estimated annual total</p>
            <p className="text-right text-lg font-semibold">{money(yearlyTotal)}</p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
        </div>
      </CardContent>
    </Card>
  );
}

