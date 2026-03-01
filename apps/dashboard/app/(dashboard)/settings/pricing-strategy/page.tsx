"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type PositioningPreset = "value" | "balanced" | "premium";

const POSITIONING_MULTIPLIER: Record<PositioningPreset, number> = {
  value: 0.95,
  balanced: 1,
  premium: 1.08,
};

const POSITIONING_LABEL: Record<PositioningPreset, string> = {
  value: "Value",
  balanced: "Balanced",
  premium: "Premium",
};

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function roundToNearestFive(value: number) {
  return Math.round(value / 5) * 5;
}

function toCurrency(value: number) {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function parseNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function PricingStrategySettingsPage() {
  const [baseSqFt, setBaseSqFt] = useState("1000");
  const [baseFee, setBaseFee] = useState("325");
  const [bandSizeSqFt, setBandSizeSqFt] = useState("500");
  const [incrementPerBand, setIncrementPerBand] = useState("60");
  const [onSiteMinutes, setOnSiteMinutes] = useState("120");
  const [reportMinutes, setReportMinutes] = useState("90");
  const [travelMinutes, setTravelMinutes] = useState("40");
  const [overheadPerInspection, setOverheadPerInspection] = useState("45");
  const [targetHourlyRate, setTargetHourlyRate] = useState("140");
  const [positioning, setPositioning] = useState<PositioningPreset>("balanced");

  const computed = useMemo(() => {
    const baseSqFtValue = clampNumber(parseNumber(baseSqFt, 1000), 500, 10000);
    const baseFeeValue = clampNumber(parseNumber(baseFee, 325), 50, 5000);
    const bandSizeValue = clampNumber(parseNumber(bandSizeSqFt, 500), 100, 5000);
    const incrementValue = clampNumber(parseNumber(incrementPerBand, 60), 1, 1000);
    const onSiteValue = clampNumber(parseNumber(onSiteMinutes, 120), 15, 1200);
    const reportValue = clampNumber(parseNumber(reportMinutes, 90), 15, 1200);
    const travelValue = clampNumber(parseNumber(travelMinutes, 40), 0, 600);
    const overheadValue = clampNumber(parseNumber(overheadPerInspection, 45), 0, 2000);
    const hourlyTargetValue = clampNumber(parseNumber(targetHourlyRate, 140), 20, 500);
    const totalHours = (onSiteValue + reportValue + travelValue) / 60;
    const targetRevenueAtBase = overheadValue + hourlyTargetValue * totalHours;
    const suggestedBaseFee = roundToNearestFive(
      targetRevenueAtBase * POSITIONING_MULTIPLIER[positioning]
    );
    const breakEvenFee = roundToNearestFive(overheadValue + totalHours * 90);
    const effectiveHourlyAtBase =
      totalHours > 0 ? (baseFeeValue - overheadValue) / totalHours : 0;
    const incrementalPerSqFt = incrementValue / bandSizeValue;

    const getPriceForSqFt = (sqFt: number) => {
      if (sqFt <= baseSqFtValue) return baseFeeValue;
      const extraSqFt = sqFt - baseSqFtValue;
      const bands = Math.ceil(extraSqFt / bandSizeValue);
      return baseFeeValue + bands * incrementValue;
    };

    const sampleHomes = [1500, 2000, 2500, 3000, 4000, 5000].map((sqFt) => ({
      sqFt,
      price: getPriceForSqFt(sqFt),
      effectiveRate: getPriceForSqFt(sqFt) / sqFt,
    }));

    const guidance =
      baseFeeValue < breakEvenFee
        ? "Base fee is below a conservative break-even threshold for your time assumptions."
        : effectiveHourlyAtBase < hourlyTargetValue
          ? "Base fee is profitable but below your target hourly rate."
          : "Base fee aligns with your target hourly rate assumptions.";

    return {
      baseSqFtValue,
      baseFeeValue,
      bandSizeValue,
      incrementValue,
      totalHours,
      overheadValue,
      hourlyTargetValue,
      targetRevenueAtBase,
      suggestedBaseFee,
      breakEvenFee,
      effectiveHourlyAtBase,
      incrementalPerSqFt,
      sampleHomes,
      guidance,
    };
  }, [
    baseSqFt,
    baseFee,
    bandSizeSqFt,
    incrementPerBand,
    onSiteMinutes,
    reportMinutes,
    travelMinutes,
    overheadPerInspection,
    targetHourlyRate,
    positioning,
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pricing Strategy Calculator</CardTitle>
          <CardDescription>
            Build an effective home-inspection pricing model using base fee, square-foot tiers, and
            target hourly economics.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="base-sqft">Base Coverage (sq ft)</Label>
              <Input id="base-sqft" value={baseSqFt} onChange={(e) => setBaseSqFt(e.target.value)} inputMode="numeric" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="base-fee">Base Fee ($)</Label>
              <Input id="base-fee" value={baseFee} onChange={(e) => setBaseFee(e.target.value)} inputMode="decimal" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="band-size">Tier Band Size (sq ft)</Label>
              <Input id="band-size" value={bandSizeSqFt} onChange={(e) => setBandSizeSqFt(e.target.value)} inputMode="numeric" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="band-increment">Increment Per Band ($)</Label>
              <Input id="band-increment" value={incrementPerBand} onChange={(e) => setIncrementPerBand(e.target.value)} inputMode="decimal" />
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="on-site-min">On-site Minutes</Label>
              <Input id="on-site-min" value={onSiteMinutes} onChange={(e) => setOnSiteMinutes(e.target.value)} inputMode="numeric" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-min">Report Minutes</Label>
              <Input id="report-min" value={reportMinutes} onChange={(e) => setReportMinutes(e.target.value)} inputMode="numeric" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="travel-min">Travel Minutes</Label>
              <Input id="travel-min" value={travelMinutes} onChange={(e) => setTravelMinutes(e.target.value)} inputMode="numeric" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="overhead">Overhead Per Inspection ($)</Label>
              <Input id="overhead" value={overheadPerInspection} onChange={(e) => setOverheadPerInspection(e.target.value)} inputMode="decimal" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="target-hourly">Target Hourly Rate ($/hr)</Label>
              <Input id="target-hourly" value={targetHourlyRate} onChange={(e) => setTargetHourlyRate(e.target.value)} inputMode="decimal" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Market Positioning</Label>
              <div className="flex flex-wrap gap-2">
                {(["value", "balanced", "premium"] as PositioningPreset[]).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPositioning(preset)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      positioning === preset
                        ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-500/10 dark:text-brand-300"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    {POSITIONING_LABEL[preset]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suggested Base Fee</CardTitle>
            <CardDescription>Based on time, overhead, and positioning</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{toCurrency(computed.suggestedBaseFee)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Target revenue at base size: {toCurrency(computed.targetRevenueAtBase)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Effective Hourly @ Base</CardTitle>
            <CardDescription>
              Using current base fee and total labor estimate ({computed.totalHours.toFixed(1)}h)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{toCurrency(computed.effectiveHourlyAtBase)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Target hourly: {toCurrency(computed.hourlyTargetValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Incremental Sq Ft Rate</CardTitle>
            <CardDescription>Derived from your tier increment</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {computed.incrementalPerSqFt.toLocaleString(undefined, {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              /sq ft
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {toCurrency(computed.incrementValue)} per {computed.bandSizeValue.toLocaleString()} sq ft
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Break-even Check</CardTitle>
            <CardDescription>Conservative floor against overhead and labor</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{toCurrency(computed.breakEvenFee)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{computed.guidance}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sample Tier Pricing Table</CardTitle>
          <CardDescription>
            Generated from your current base and band assumptions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-3 py-2 font-medium">Home Size</th>
                  <th className="px-3 py-2 font-medium">Recommended Quote</th>
                  <th className="px-3 py-2 font-medium">Effective Rate</th>
                </tr>
              </thead>
              <tbody>
                {computed.sampleHomes.map((row) => (
                  <tr key={row.sqFt} className="border-t">
                    <td className="px-3 py-2">{row.sqFt.toLocaleString()} sq ft</td>
                    <td className="px-3 py-2 font-medium">{toCurrency(row.price)}</td>
                    <td className="px-3 py-2">
                      {row.effectiveRate.toLocaleString(undefined, {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      /sq ft
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge color="light">
              Base: {toCurrency(computed.baseFeeValue)} up to {computed.baseSqFtValue.toLocaleString()} sq ft
            </Badge>
            <Badge color="light">
              Tier Increment: {toCurrency(computed.incrementValue)} every {computed.bandSizeValue.toLocaleString()} sq ft
            </Badge>
            <Badge color="light">
              Positioning: {POSITIONING_LABEL[positioning]}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
