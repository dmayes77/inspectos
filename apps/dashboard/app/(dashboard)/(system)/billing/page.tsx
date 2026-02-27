"use client";

import { AdminPageHeader } from "@/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

export default function BillingPage() {
  return (
    <>
    <div className="space-y-6">
      <AdminPageHeader
        title="Billing"
        description="Plans, subscriptions, and recurring billing settings"
        actions={
          <Button className="sm:w-auto">
            <CreditCard className="mr-2 h-4 w-4" />
            Manage Plans
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {["Active Subscriptions", "MRR", "Churn"].map((label) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-semibold">—</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
          <CardDescription>Set recurring billing rules and payment methods.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
            Configure plans and connect payment processors to enable subscriptions.
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
