import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Receipt, Download } from "lucide-react";

const mockInvoices = [
  { id: "INV-001", date: "2024-01-15", amount: 99, status: "paid" },
  { id: "INV-002", date: "2024-02-15", amount: 99, status: "paid" },
  { id: "INV-003", date: "2024-03-15", amount: 99, status: "paid" },
  { id: "INV-004", date: "2024-04-15", amount: 99, status: "pending" },
  { id: "INV-005", date: "2024-05-15", amount: 99, status: "pending" },
];

export default function BillingPage() {
  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center gap-4">
      </div>

      <AdminPageHeader
        title="Billing & Invoices"
        description="Manage your subscription and view invoices"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>Current Plan</CardTitle>
            </div>
            <CardDescription>
              You are currently on the Professional plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <h3 className="font-semibold">Professional</h3>
                <p className="text-sm text-muted-foreground">
                  Up to 5 inspectors, all features included
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">$99</p>
                <p className="text-sm text-muted-foreground">/month</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline">Change Plan</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>
              Manage your payment methods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-14 items-center justify-center rounded bg-slate-800 text-white text-xs font-bold">
                  VISA
                </div>
                <div>
                  <p className="font-medium">•••• •••• •••• 4242</p>
                  <p className="text-sm text-muted-foreground">Expires 12/2027</p>
                </div>
              </div>
              <Button variant="outline">Update</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            <CardTitle>Invoices</CardTitle>
          </div>
          <CardDescription>
            View and download your billing history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{invoice.id}</p>
                    <p className="text-sm text-muted-foreground">{invoice.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={invoice.status === "paid" ? "secondary" : "outline"}>
                    {invoice.status === "paid" ? "Paid" : "Pending"}
                  </Badge>
                  <span className="font-medium">${invoice.amount}</span>
                  <Button variant="ghost">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
