"use client";

import { AdminPageHeader } from "@/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

export default function BillingPage() {
  const { data: settings, isLoading } = useSettings();

  if (isLoading || !settings) {
    return <div className="p-6 text-sm text-muted-foreground">Loading billing...</div>;
  }

  const billing = settings.business.inspectorBilling;
  const base = settings.billing.baseMonthlyPrice;
  const currency = billing.currency;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Billing & Invoices"
        description="Inspector seats are tied to your plan limits and billed automatically."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>Current Plan</CardTitle>
            </div>
            <CardDescription>
              {settings.billing.planName} ({settings.billing.planCode.toUpperCase()})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border p-4">
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inspector Seat Billing</CardTitle>
            <CardDescription>Live seat usage and monthly overage calculation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current inspector seats</span>
                <span className="text-lg font-semibold">{settings.business.inspectorSeatCount}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Billable additional seats</span>
                <span className="font-medium">{billing.billableAdditionalSeats}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Additional seats charge</span>
                <span className="font-medium">{money(billing.additionalSeatsMonthlyCharge, currency)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estimated monthly total</span>
                <span className="text-lg font-semibold">{money(billing.estimatedMonthlyTotal, currency)}</span>
              </div>
            </div>

            {billing.overSeatLimitBy > 0 ? (
              <Badge color="error">
                Over seat limit by {billing.overSeatLimitBy}. Upgrade plan or reduce inspector seats.
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

