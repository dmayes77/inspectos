"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModernDataTable } from "@/components/ui/modern-data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, MapPin, User, Search, Calendar, FileText } from "lucide-react";
import { useOrders, type Order } from "@/hooks/use-orders";
import { cn } from "@/lib/utils";
import { formatDateShort, formatTime12 } from "@inspectos/shared/utils/dates";
import { AdminPageSkeleton } from "@/layout/admin-page-skeleton";

const orderStatusOptions = [
  { value: "all", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending_report", label: "Pending Report" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const paymentStatusOptions = [
  { value: "all", label: "All Payments" },
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
  { value: "refunded", label: "Refunded" },
];

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "pending":
      return "light";
    case "scheduled":
      return "light";
    case "in_progress":
      return "primary";
    case "pending_report":
      return "primary";
    case "delivered":
      return "primary";
    case "completed":
      return "primary";
    case "cancelled":
      return "error";
    default:
      return "light";
  }
}

function getStatusBadgeClasses(status: string) {
  switch (status) {
    case "pending":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "scheduled":
      return "bg-brand-100 text-brand-700 border-brand-200";
    case "in_progress":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "pending_report":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "delivered":
      return "bg-green-100 text-green-800 border-green-200";
    case "completed":
      return "bg-green-500 text-white border-green-500";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "";
  }
}

function getPaymentBadgeClasses(status: string) {
  switch (status) {
    case "unpaid":
      return "bg-red-100 text-red-800 border-red-200";
    case "partial":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "paid":
      return "bg-green-100 text-green-800 border-green-200";
    case "refunded":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "";
  }
}

function formatStatusLabel(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getOrderAddress(order: Order) {
  const property = order.property;
  if (!property) return "Property unavailable";
  return [property.address_line1, property.address_line2, `${property.city}, ${property.state} ${property.zip_code}`].filter(Boolean).join(", ");
}

const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "order_number",
    header: "Order",
    enableHiding: false,
    cell: ({ row }) => (
      <Link href={`/orders/${row.original.order_number}`} className="font-medium hover:underline text-xs">
        {row.original.order_number}
      </Link>
    ),
  },
  {
    id: "property",
    header: "Property",
    cell: ({ row }) => (
      <Link href={`/orders/${row.original.order_number}`} className="text-xs max-w-xs hover:underline">
        {getOrderAddress(row.original)}
      </Link>
    ),
  },
  {
    id: "client",
    header: "Client",
    cell: ({ row }) => <span className="text-xs">{row.original.client?.name ?? "—"}</span>,
  },
  {
    id: "agent",
    header: "Agent",
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.agent?.name ?? "—"}</span>,
  },
  {
    id: "scheduled",
    header: "Scheduled",
    cell: ({ row }) => {
      const date = row.original.scheduled_date;
      const time = row.original.scheduled_time;
      if (!date) return <span className="text-xs text-muted-foreground">Unscheduled</span>;
      return (
        <div className="text-xs">
          <div>{formatDateShort(date)}</div>
          {time && <div className="text-muted-foreground">{formatTime12(time)}</div>}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge color={getStatusBadgeVariant(row.original.status)} className={cn("text-xs", getStatusBadgeClasses(row.original.status))}>
        {formatStatusLabel(row.original.status)}
      </Badge>
    ),
  },
  {
    accessorKey: "payment_status",
    header: "Payment",
    cell: ({ row }) => (
      <Badge color="light" className={cn("text-xs", getPaymentBadgeClasses(row.original.payment_status))}>
        {formatStatusLabel(row.original.payment_status)}
      </Badge>
    ),
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => <span className="text-xs font-medium">${row.original.total.toFixed(2)}</span>,
  },
];

export default function OrdersPage() {
  const { data, isLoading, isError } = useOrders();
  const orders = useMemo(() => data ?? [], [data]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesPayment = paymentFilter === "all" || order.payment_status === paymentFilter;
      if (!matchesStatus || !matchesPayment) return false;

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const address = getOrderAddress(order).toLowerCase();
      const clientName = order.client?.name?.toLowerCase() ?? "";
      const orderNumber = order.order_number.toLowerCase();
      return address.includes(query) || clientName.includes(query) || orderNumber.includes(query);
    });
  }, [orders, statusFilter, paymentFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === "pending").length;
    const scheduled = orders.filter((o) => o.status === "scheduled").length;
    const inProgress = orders.filter((o) => o.status === "in_progress").length;
    const unpaid = orders.filter((o) => o.payment_status === "unpaid").length;
    const completed = orders.filter((o) => o.status === "completed").length;
    const totalRevenue = orders.filter((o) => o.payment_status === "paid").reduce((sum, o) => sum + o.total, 0);
    return { pending, scheduled, inProgress, unpaid, completed, totalRevenue };
  }, [orders]);

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return <AdminPageSkeleton showTable listItems={10} />;
  }
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Orders"
        description="Manage inspection orders - the complete business lifecycle"
        actions={
          <Button asChild>
            <Link href="/orders/new">
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Link>
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Scheduled" value={stats.scheduled} />
        <StatCard label="In Progress" value={stats.inProgress} />
        <StatCard label="Unpaid" value={stats.unpaid} />
        <StatCard label="Completed" value={stats.completed} />
        <StatCard label="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} />
      </div>

      {/* Mobile View - Custom Cards */}
      <div className="md:hidden space-y-4">
        {isError ? (
          <div className="rounded-md border border-dashed p-6 text-center">
            <p className="text-sm text-red-500">Failed to load orders.</p>
          </div>
        ) : filteredOrders.length === 0 && !isLoading ? (
          <div className="rounded-md border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">No orders found.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            return (
              <Link
                key={order.id}
                href={`/orders/${order.order_number}`}
                className="block rounded-md border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">Order</p>
                    <p className="text-sm font-semibold truncate">{order.order_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">Total</p>
                    <p className="text-sm font-semibold text-foreground">${order.total.toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge
                    color={getStatusBadgeVariant(order.status)}
                    className={cn("font-medium text-[0.65rem] px-2 py-0.5", getStatusBadgeClasses(order.status))}
                  >
                    {formatStatusLabel(order.status)}
                  </Badge>
                  <Badge color="light" className={cn("font-medium text-[0.65rem] px-2 py-0.5", getPaymentBadgeClasses(order.payment_status))}>
                    {formatStatusLabel(order.payment_status)}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[0.65rem] text-muted-foreground">
                  <span className="rounded-md border px-2 py-0.5">Agent: {order.agent?.name ?? "Unassigned"}</span>
                  <span className="rounded-md border px-2 py-0.5">Services: {order.services?.length ?? 0}</span>
                </div>

                <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="line-clamp-2">{getOrderAddress(order)}</span>
                </div>

                <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    <span className="truncate">{order.client?.name ?? "No client"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {order.scheduled_date ? formatDateShort(order.scheduled_date) : "Unscheduled"}
                      {order.scheduled_time ? ` • ${formatTime12(order.scheduled_time)}` : ""}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Desktop View - ModernDataTable */}
      <div className="hidden md:block">
        <ModernDataTable
          columns={columns}
          data={filteredOrders}
          title="All Orders"
          description={`${filteredOrders.length} of ${orders.length} orders`}
          filterControls={
            <>
              <div className="relative flex-1 min-w-50 md:flex-initial md:w-75">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search orders..."
                  className="pl-9!"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-35">
                  <SelectValue placeholder="All Orders" />
                </SelectTrigger>
                <SelectContent>
                  {orderStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-35">
                  <SelectValue placeholder="All Payments" />
                </SelectTrigger>
                <SelectContent>
                  {paymentStatusOptions.map((option) => (
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
              <div className="rounded-md border border-dashed p-10 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold text-red-500">Failed to load orders</h3>
                <p className="mt-2 text-sm text-muted-foreground">Please try refreshing the page.</p>
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-10 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No orders yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">Create your first order to start managing inspections.</p>
                <Button asChild className="mt-6">
                  <Link href="/orders/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Order
                  </Link>
                </Button>
              </div>
            )
          }
        />
      </div>
    </div>
  );
}
