"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard } from "lucide-react";
import { usePayments, useRecordPayment } from "@/hooks/use-payments";
import { useInvoices } from "@/hooks/use-invoices";
import { useOrders } from "@/hooks/use-orders";
import { TagAssignmentEditor } from "@/components/tags/tag-assignment-editor";
import { formatInvoiceNumber } from "@inspectos/shared/utils/invoices";
import { toast } from "sonner";

export default function PaymentsPage() {
  const { data: payments = [], isLoading: paymentsLoading } = usePayments();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const { data: orders = [] } = useOrders();
  const recordPaymentMutation = useRecordPayment();

  const [showDialog, setShowDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [notes, setNotes] = useState("");

  const unpaidOrders = orders.filter(
    (order) => order.payment_status === "unpaid" || order.payment_status === "partial"
  );

  const hasInvoices = invoices.length > 0;
  const pendingTotal = invoices
    .filter((invoice) => invoice.status === "sent" || invoice.status === "overdue")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const pendingFromOrders = unpaidOrders.reduce((sum, order) => sum + order.total, 0);
  const pendingAmount = hasInvoices ? pendingTotal : pendingFromOrders;
  const today = new Date().toISOString().slice(0, 10);
  const collectedToday = payments
    .filter((payment) => payment.paidDate === today)
    .reduce((sum, payment) => sum + payment.amount, 0);

  const handleRecordPayment = () => {
    if (!selectedOrderId || !amount || !method) {
      toast.error("Please fill in all required fields");
      return;
    }

    recordPaymentMutation.mutate(
      {
        order_id: selectedOrderId,
        amount: parseFloat(amount),
        method,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Payment recorded successfully");
          setShowDialog(false);
          setSelectedOrderId("");
          setAmount("");
          setMethod("");
          setNotes("");
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to record payment");
        },
      }
    );
  };

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      setAmount(order.total.toString());
    }
  };

  return (
    <>
    <div className="space-y-6">
      <AdminPageHeader
        title="Payments"
        description="Track deposits, final payments, and refunds"
        actions={
          <Button className="sm:w-auto" onClick={() => setShowDialog(true)}>
            <CreditCard className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Collected Today" value={`$${collectedToday.toFixed(2)}`} />
        <StatCard label="Pending" value={`$${pendingAmount.toFixed(2)}`} />
        <StatCard label="Refunded" value="$0.00" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Activity</CardTitle>
          <CardDescription>Connect payment processors and monitor collections.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {paymentsLoading || invoicesLoading ? (
            <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
              Loading payments...
            </div>
          ) : payments.length === 0 ? (
            <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
              No payments yet. Payments will appear as orders are paid.
            </div>
          ) : (
            payments.map((payment) => (
              <div key={payment.paymentId} className="flex flex-wrap items-start justify-between gap-3 rounded-md border p-4 text-sm">
                <div className="space-y-2">
                  <div>
                    <p className="font-medium">{payment.clientName || "Unknown client"}</p>
                    <p className="text-xs text-muted-foreground">
                      {payment.paidDate || "—"} • {payment.method} • {payment.invoiceId ? formatInvoiceNumber(payment.invoiceId) : "No invoice"}
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

    {/* Record Payment Dialog */}
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment received for an order.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="order">Order</Label>
            <Select value={selectedOrderId} onValueChange={handleOrderSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select an order" />
              </SelectTrigger>
              <SelectContent>
                {unpaidOrders.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No unpaid orders
                  </SelectItem>
                ) : (
                  unpaidOrders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.order_number} - {order.client?.name || "No client"} (${order.total.toFixed(2)})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="method">Payment Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">Credit/Debit Card</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="Payment notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleRecordPayment} disabled={recordPaymentMutation.isPending}>
            {recordPaymentMutation.isPending ? "Recording..." : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
