"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Loader2, RefreshCw } from "lucide-react";
import {
  useChangeBillingPlan,
  useCreateBillingPortalSession,
  useSettings,
  useUpdateSettings,
} from "@/hooks/use-settings";
import { toast } from "sonner";

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function BillingPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const changePlan = useChangeBillingPlan();
  const createPortalSession = useCreateBillingPortalSession();
  const [seatCountDraft, setSeatCountDraft] = useState<number>(1);
  const [planDraft, setPlanDraft] = useState<"growth" | "team">("growth");

  const billing = settings?.business?.inspectorBilling;
  const base = settings?.billing?.baseMonthlyPrice ?? 0;
  const currency = billing?.currency ?? "USD";
  const minSeats = billing?.includedInspectors ?? 1;
  const maxSeats = billing?.maxInspectors ?? 1;
  const selectedInspectorSeats = billing?.selectedInspectorSeats ?? minSeats;
  const usedInspectorSeats = billing?.usedInspectorSeats ?? 0;
  const isDirty = seatCountDraft !== selectedInspectorSeats;
  const isPlanDirty = planDraft !== settings?.billing?.planCode;
  const subscriptionStatus = settings?.billing?.subscriptionStatus ?? "unknown";
  const currentPeriodStart = settings?.billing?.stripeCurrentPeriodStart ?? null;
  const currentPeriodEnd = settings?.billing?.stripeCurrentPeriodEnd ?? null;
  const trialEndsAt = settings?.billing?.trialEndsAt ?? null;
  const nextRenewalDate = currentPeriodEnd ?? trialEndsAt ?? null;

  useEffect(() => {
    setSeatCountDraft(selectedInspectorSeats);
  }, [selectedInspectorSeats]);

  useEffect(() => {
    const plan = settings?.billing?.planCode;
    if (plan === "growth" || plan === "team") {
      setPlanDraft(plan);
    }
  }, [settings?.billing?.planCode]);

  const clampedSeatCount = useMemo(
    () => Math.max(minSeats, Math.min(maxSeats, Number.isFinite(seatCountDraft) ? seatCountDraft : minSeats)),
    [maxSeats, minSeats, seatCountDraft]
  );

  const handleSaveSeats = () => {
    updateSettings.mutate(
      { billing: { inspectorSeatCount: clampedSeatCount } },
      {
        onSuccess: () => {
          toast.success("Seat count updated");
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to update seats");
        },
      }
    );
  };

  const handleChangePlan = () => {
    changePlan.mutate(
      { planCode: planDraft },
      {
        onSuccess: (data) => {
          toast.success(data.changed ? `Plan changed to ${data.planName ?? planDraft}` : data.message ?? "Plan unchanged");
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to change plan");
        },
      }
    );
  };

  const handleManagePaymentMethod = () => {
    createPortalSession.mutate(undefined, {
      onSuccess: (data) => {
        if (!data.url) {
          toast.error("Billing portal URL was not returned.");
          return;
        }
        window.location.href = data.url;
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to open billing portal");
      },
    });
  };

  if (isLoading || !settings || !billing) {
    return <div className="p-6 text-sm text-muted-foreground">Loading billing...</div>;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Billing & Invoices"
        description="Manage plan, seats, renewal, and payment method from one place."
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>Subscription</CardTitle>
            </div>
            <CardDescription>
              {settings.billing.planName} ({settings.billing.planCode.toUpperCase()}) · {currency}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Base monthly</span>
                <span className="text-lg font-semibold">{money(base, currency)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Included inspector seats</span>
                <span className="font-medium">{billing.includedInspectors}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Additional seat price</span>
                <span className="font-medium">{money(billing.additionalInspectorPrice, currency)}/seat</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Max seats on plan</span>
                <span className="font-medium">{billing.maxInspectors}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subscription status</span>
                <span className="font-medium capitalize">{subscriptionStatus.replace(/_/g, " ")}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Billing period</span>
                <span className="font-medium">
                  {currentPeriodStart || currentPeriodEnd
                    ? `${formatDate(currentPeriodStart)} - ${formatDate(currentPeriodEnd)}`
                    : "—"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Next renewal</span>
                <span className="font-medium">{formatDate(nextRenewalDate)}</span>
              </div>
              <div className="mt-4 border-t pt-4">
                <p className="mb-2 text-sm font-medium">Purchased seats</p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSeatCountDraft((prev) => Math.max(minSeats, prev - 1))}
                    disabled={updateSettings.isPending || clampedSeatCount <= minSeats}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    value={seatCountDraft}
                    onChange={(event) => setSeatCountDraft(Number(event.target.value))}
                    min={minSeats}
                    max={maxSeats}
                    className="w-24 text-center"
                    disabled={updateSettings.isPending}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSeatCountDraft((prev) => Math.min(maxSeats, prev + 1))}
                    disabled={updateSettings.isPending || clampedSeatCount >= maxSeats}
                  >
                    +
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveSeats}
                    disabled={updateSettings.isPending || !isDirty}
                  >
                    {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save seats"}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Allowed range: {minSeats} to {maxSeats}. Cannot go below active assignments ({usedInspectorSeats}).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan Management</CardTitle>
            <CardDescription>Owner/admin can switch plans and keep seat assignments in sync.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current plan</span>
                <span className="font-medium">{settings.billing.planName}</span>
              </div>

              <div className="mt-4 space-y-2">
                <span className="text-sm text-muted-foreground">Target plan</span>
                <Select value={planDraft} onValueChange={(value) => setPlanDraft(value as "growth" | "team")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4">
                <Button
                  type="button"
                  onClick={handleChangePlan}
                  disabled={changePlan.isPending || !isPlanDirty}
                  className="w-full"
                >
                  {changePlan.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply plan change"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing Details</CardTitle>
            <CardDescription>Usage, monthly total, and payment method access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border p-4">
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Purchased seats</span>
                <span className="font-medium">{billing.selectedInspectorSeats}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Seats in use</span>
                <span className="font-medium">{billing.usedInspectorSeats}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Remaining seats</span>
                <span className="font-medium">{billing.remainingInspectorSeats}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Additional seats charge</span>
                <span className="font-medium">{money(billing.additionalSeatsMonthlyCharge, currency)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estimated monthly total</span>
                <span className="text-lg font-semibold">{money(billing.estimatedMonthlyTotal, currency)}</span>
              </div>

              <div className="mt-4 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleManagePaymentMethod}
                  disabled={createPortalSession.isPending}
                >
                  {createPortalSession.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Manage payment method
                    </>
                  )}
                </Button>
              </div>
            </div>

            {billing.overAssignedSeats > 0 ? (
              <Badge color="error">
                {billing.overAssignedSeats} inspector(s) assigned above purchased seats.
              </Badge>
            ) : billing.overSeatLimitBy > 0 ? (
              <Badge color="error">
                Purchased seats exceed plan limit by {billing.overSeatLimitBy}. Upgrade plan or lower seat count.
              </Badge>
            ) : (
              <Badge color="light">Within plan inspector seat limit.</Badge>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
