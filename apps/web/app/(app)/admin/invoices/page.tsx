"use client";

import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilePlus } from "lucide-react";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { Badge } from "@/components/ui/badge";
import { useInvoices } from "@/hooks/use-invoices";
import { TagAssignmentEditor } from "@/components/tags/tag-assignment-editor";

export default function InvoicesPage() {
  const { data: invoices = [], isLoading } = useInvoices();
  const totals = invoices.reduce(
    (acc, invoice) => {
      if (invoice.status === "paid") acc.paid += invoice.amount;
      if (invoice.status === "overdue") acc.overdue += invoice.amount;
      if (invoice.status === "sent" || invoice.status === "draft") acc.outstanding += invoice.amount;
      return acc;
    },
    { outstanding: 0, paid: 0, overdue: 0 }
  );
  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Invoices"
          description="Generate invoices, track balances, and send payment reminders"
          actions={
            <Button className="sm:w-auto">
              <FilePlus className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Outstanding</p>
              <p className="mt-2 text-2xl font-semibold">${totals.outstanding.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Paid</p>
              <p className="mt-2 text-2xl font-semibold">${totals.paid.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Overdue</p>
              <p className="mt-2 text-2xl font-semibold">${totals.overdue.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Activity</CardTitle>
            <CardDescription>Send invoices for inspections and add-ons.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                Loading invoices...
              </div>
            ) : invoices.length === 0 ? (
              <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                No invoices yet. Create an invoice from an inspection or package.
              </div>
            ) : (
              invoices.map((invoice) => (
                <div key={invoice.invoiceId} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4 text-sm">
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium">{invoice.invoiceId}</p>
                      <p className="text-xs text-muted-foreground">
                        {invoice.clientName || "Unknown client"} • Issued {invoice.issuedDate || "—"}
                      </p>
                    </div>
                    <TagAssignmentEditor scope="invoice" entityId={invoice.invoiceId} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{invoice.status}</Badge>
                    <span className="text-xs font-semibold text-muted-foreground">${invoice.amount}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
