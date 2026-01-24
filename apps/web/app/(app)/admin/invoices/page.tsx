"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { FilePlus, ArrowRight, Search } from "lucide-react";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { useInvoices } from "@/hooks/use-invoices";
import { TagAssignmentEditor } from "@/components/tags/tag-assignment-editor";
import { useOrders } from "@/hooks/use-orders";
import { formatDate } from "@/lib/utils/dates";
import { formatInvoiceNumber } from "@/lib/utils/invoices";
import type { InvoiceRecord } from "@/lib/data/invoices";

const invoiceStatusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
];

const formatStatusLabel = (status: string) =>
  status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const columns: ColumnDef<InvoiceRecord>[] = [
  {
    accessorKey: "invoiceId",
    header: "Invoice",
    cell: ({ row }) => (
      <Link
        href={`/admin/invoices/${row.original.invoiceId}`}
        className="font-medium hover:underline"
      >
        {row.original.invoiceNumber || formatInvoiceNumber(row.original.invoiceId)}
      </Link>
    ),
  },
  {
    accessorKey: "clientName",
    header: "Client",
    cell: ({ row }) => <span>{row.original.clientName || "Unknown client"}</span>,
  },
  {
    accessorKey: "issuedDate",
    header: "Issued",
    cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.issuedDate || "—")}</span>,
  },
  {
    accessorKey: "dueDate",
    header: "Due",
    cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.dueDate || "—")}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {formatStatusLabel(row.original.status)}
      </Badge>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <span className="font-semibold text-muted-foreground">${row.original.amount.toFixed(2)}</span>
    ),
  },
];

export default function InvoicesPage() {
  const { data: invoices = [], isLoading, isError } = useInvoices();
  const { data: orders = [] } = useOrders();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const hasInvoices = invoices.length > 0;
  const totals = invoices.reduce(
    (acc, invoice) => {
      if (invoice.status === "paid") acc.paid += invoice.amount;
      if (invoice.status === "overdue") acc.overdue += invoice.amount;
      if (invoice.status === "sent" || invoice.status === "draft") acc.outstanding += invoice.amount;
      return acc;
    },
    { outstanding: 0, paid: 0, overdue: 0 }
  );
  const orderTotals = orders.reduce(
    (acc, order) => {
      if (order.payment_status === "paid") acc.paid += order.total;
      if (order.payment_status === "unpaid" || order.payment_status === "partial") {
        acc.outstanding += order.total;
        acc.unpaidCount += 1;
      }
      return acc;
    },
    { outstanding: 0, paid: 0, unpaidCount: 0 }
  );
  const outstandingTotal = hasInvoices ? totals.outstanding : orderTotals.outstanding;
  const paidTotal = hasInvoices ? totals.paid : orderTotals.paid;
  const overdueTotal = hasInvoices ? totals.overdue : 0;
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
      if (!matchesStatus) return false;
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const clientName = invoice.clientName?.toLowerCase() ?? "";
      return (
        invoice.invoiceId.toLowerCase().includes(query) ||
        invoice.invoiceNumber?.toLowerCase().includes(query) ||
        clientName.includes(query)
      );
    });
  }, [invoices, searchQuery, statusFilter]);

  const emptyState = (
    <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
      No invoices yet. Create an invoice from an order.
      {orderTotals.unpaidCount > 0 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">
            {orderTotals.unpaidCount} unpaid orders ready to invoice
          </span>
          <Button variant="link" className="h-auto p-0" asChild>
            <Link href="/admin/orders">
              Review orders
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Invoices"
          description="Generate invoices, track balances, and send payment reminders"
          actions={
            <Button className="sm:w-auto" asChild>
              <Link href="/admin/invoices/new">
                <FilePlus className="mr-2 h-4 w-4" />
                New Invoice
              </Link>
            </Button>
          }
        />

        <div className="grid grid-cols-3 gap-3 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Outstanding</CardDescription>
              <CardTitle className="text-2xl">${outstandingTotal.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Paid</CardDescription>
              <CardTitle className="text-2xl">${paidTotal.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Overdue</CardDescription>
              <CardTitle className="text-2xl">${overdueTotal.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
              <div className="relative w-full md:flex-1 md:min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search invoices..."
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full min-w-[160px] md:w-[200px]">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    {invoiceStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-full justify-end md:ml-auto md:w-auto">
                <Button
                  variant="ghost"
                  className="w-auto"
                  onClick={() => {
                    setStatusFilter("all");
                    setSearchQuery("");
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Invoices</CardTitle>
            <CardDescription>
              {isLoading ? "Loading..." : `${filteredInvoices.length} invoices`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isError ? (
              <div className="text-red-500">Failed to load invoices.</div>
            ) : (
              <>
                <div className="md:hidden space-y-3">
                  {isLoading ? (
                    <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                      Loading invoices...
                    </div>
                  ) : filteredInvoices.length === 0 ? (
                    emptyState
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <div key={invoice.invoiceId} className="rounded-lg border p-4 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <Link
                              href={`/admin/invoices/${invoice.invoiceId}`}
                              className="font-semibold hover:underline"
                            >
                              {invoice.invoiceNumber || formatInvoiceNumber(invoice.invoiceId)}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {invoice.clientName || "Unknown client"} • Issued {formatDate(invoice.issuedDate || "—")}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="capitalize">
                              {formatStatusLabel(invoice.status)}
                            </Badge>
                            <p className="mt-2 text-xs font-semibold text-muted-foreground">
                              ${invoice.amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-muted-foreground">
                          Due {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
                        </div>
                        <div className="mt-3">
                          <TagAssignmentEditor scope="invoice" entityId={invoice.invoiceId} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="hidden md:block">
                  {isLoading ? (
                    <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                      Loading invoices...
                    </div>
                  ) : filteredInvoices.length === 0 ? (
                    emptyState
                  ) : (
                    <DataTable columns={columns} data={filteredInvoices} />
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
