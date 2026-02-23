"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ModernDataTable } from "@/components/ui/modern-data-table";
import { FilePlus, ArrowRight, Search, FileText } from "lucide-react";
import { useInvoices } from "@/hooks/use-invoices";
import { TagAssignmentEditor } from "@/components/tags/tag-assignment-editor";
import { useOrders } from "@/hooks/use-orders";
import { formatDate } from "@inspectos/shared/utils/dates";
import { formatInvoiceNumber } from "@inspectos/shared/utils/invoices";
import { ResourceListLayout } from "@/components/shared/resource-list-layout";
import {
  formatInvoiceStatusLabel,
  invoiceStatusOptions,
  invoiceTableColumns,
} from "@/components/invoices/invoice-table-columns";
import { AdminPageSkeleton } from "@/layout/admin-page-skeleton";

export default function InvoicesPage() {
  const { data: invoices = [], isLoading, isError } = useInvoices();
  const { data: orders = [] } = useOrders();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return <AdminPageSkeleton showStats showTable listItems={10} />;
  }

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

  const emptyState = (
    <div className="rounded-sm border border-dashed p-10 text-center text-sm text-muted-foreground">
      No invoices yet. Create an invoice from an order.
      {orderTotals.unpaidCount > 0 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">
            {orderTotals.unpaidCount} unpaid orders ready to invoice
          </span>
          <Button variant="link" className="h-auto p-0" asChild>
            <Link href="/app/orders">
              Review orders
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <ResourceListLayout
      header={
        <AdminPageHeader
          title="Invoices"
          description="Generate invoices, track balances, and send payment reminders"
          actions={
            <Button className="sm:w-auto" asChild>
              <Link href="/app/invoices/new">
                <FilePlus className="mr-2 h-4 w-4" />
                New Invoice
              </Link>
            </Button>
          }
        />
      }
      stats={
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Outstanding" value={`$${outstandingTotal.toFixed(2)}`} />
          <StatCard label="Paid" value={`$${paidTotal.toFixed(2)}`} />
          <StatCard label="Overdue" value={`$${overdueTotal.toFixed(2)}`} />
        </div>
      }
      table={
        <>
          {/* Mobile View - Custom Cards */}
          <div className="md:hidden space-y-3">
            {isError ? (
              <div className="rounded-sm border border-dashed p-6 text-center">
                <p className="text-sm text-red-500">Failed to load invoices.</p>
              </div>
            ) : isLoading ? (
              <div className="rounded-sm border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">Loading invoices...</p>
              </div>
            ) : filteredInvoices.length === 0 ? (
              emptyState
            ) : (
              filteredInvoices.map((invoice) => (
                <div key={invoice.invoiceId} className="rounded-sm border p-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/app/invoices/${invoice.invoiceId}`}
                        className="font-semibold hover:underline"
                      >
                        {invoice.invoiceNumber || formatInvoiceNumber(invoice.invoiceId)}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {invoice.clientName || "Unknown client"} • Issued{" "}
                        {formatDate(invoice.issuedDate || "—")}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge color="light" className="capitalize">
                        {formatInvoiceStatusLabel(invoice.status)}
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

          {/* Desktop View - ModernDataTable */}
          <div className="hidden md:block">
            <ModernDataTable
              columns={invoiceTableColumns}
              data={filteredInvoices}
              title="All Invoices"
              description={`${filteredInvoices.length} of ${invoices.length} invoices`}
              filterControls={
                <>
                  <div className="relative flex-1 min-w-50 md:flex-initial md:w-75">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search invoices..."
                      className="pl-9!"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-35">
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
                </>
              }
              emptyState={
                isError ? (
                  <div className="rounded-sm border border-dashed p-10 text-center">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold text-red-500">Failed to load invoices</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Please try refreshing the page.</p>
                  </div>
                ) : (
                  <div className="rounded-sm border border-dashed p-10 text-center">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold">No invoices yet</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Create an invoice from an order.
                    </p>
                    {orderTotals.unpaidCount > 0 && (
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {orderTotals.unpaidCount} unpaid orders ready to invoice
                        </span>
                        <Button variant="link" className="h-auto p-0" asChild>
                          <Link href="/app/orders">
                            Review orders
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )
              }
            />
          </div>
        </>
      }
    />
  );
}
