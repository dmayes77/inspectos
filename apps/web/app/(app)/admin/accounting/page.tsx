"use client";

import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";
import { mockAdminUser } from "@/lib/constants/mock-users";

export default function AccountingPage() {
  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Accounting"
          description="General ledger, P&L, and reconciliation"
          actions={
            <Button className="sm:w-auto" variant="outline">
              <DollarSign className="mr-2 h-4 w-4" />
              Connect Accounting
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          {["Profit & Loss", "Balance Sheet", "Cash Flow"].map((label) => (
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
            <CardTitle>Chart of Accounts</CardTitle>
            <CardDescription>Sync categories and map revenue/expenses.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              Connect accounting to unlock ledger and reporting.
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
