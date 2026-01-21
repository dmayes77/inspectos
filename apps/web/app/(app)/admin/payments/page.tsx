"use client";

import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { usePayments } from "@/hooks/use-payments";
import { useInvoices } from "@/hooks/use-invoices";
import { TagAssignmentEditor } from "@/components/tags/tag-assignment-editor";

export default function PaymentsPage() {
  const { data: payments = [], isLoading: paymentsLoading } = usePayments();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const pendingTotal = invoices
    .filter((invoice) => invoice.status === "sent" || invoice.status === "overdue")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const today = new Date().toISOString().slice(0, 10);
  const collectedToday = payments
    .filter((payment) => payment.paidDate === today)
    .reduce((sum, payment) => sum + payment.amount, 0);
  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Payments"
          description="Track deposits, final payments, and refunds"
          actions={
            <Button className="sm:w-auto">
              <CreditCard className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Collected Today</p>
              <p className="mt-2 text-2xl font-semibold">${collectedToday.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending</p>
              <p className="mt-2 text-2xl font-semibold">${pendingTotal.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Refunded</p>
              <p className="mt-2 text-2xl font-semibold">$0.00</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Activity</CardTitle>
            <CardDescription>Connect payment processors and monitor collections.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentsLoading || invoicesLoading ? (
              <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                Loading payments...
              </div>
            ) : payments.length === 0 ? (
              <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                No payments yet. Payments will appear as invoices are paid.
              </div>
            ) : (
              payments.map((payment) => (
                <div key={payment.paymentId} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4 text-sm">
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium">{payment.clientName || "Unknown client"}</p>
                      <p className="text-xs text-muted-foreground">
                        {payment.paidDate || "—"} • {payment.method} • {payment.invoiceId || "No invoice"}
                      </p>
                    </div>
                    <TagAssignmentEditor scope="payment" entityId={payment.paymentId} />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">${payment.amount}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
