"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, MapPin, User, Search, Calendar, DollarSign, Building2, FileText, Clock } from "lucide-react";
import { useOrders, type Order } from "@/hooks/use-orders";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { can } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";
import { formatDateShort, formatTime12 } from "@/lib/utils/dates";
import { AdminPageSkeleton } from "@/components/layout/admin-page-skeleton";

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
      return "secondary";
    case "scheduled":
      return "outline";
    case "in_progress":
      return "default";
    case "pending_report":
      return "default";
    case "delivered":
      return "default";
    case "completed":
      return "default";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
}

function getStatusBadgeClasses(status: string) {
  switch (status) {
    case "pending":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "scheduled":
      return "bg-blue-100 text-blue-800 border-blue-200";
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
    cell: ({ row }) => (
      <Link href={`/admin/orders/${row.original.id}`} className="flex items-center gap-2 font-medium hover:underline">
        <FileText className="h-4 w-4 text-muted-foreground" />
        {row.original.order_number}
      </Link>
    ),
  },
  {
    id: "property",
    header: "Property",
    cell: ({ row }) => (
      <Link href={`/admin/orders/${row.original.id}`} className="flex items-start gap-2 max-w-xs hover:text-foreground">
        <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <span className="text-sm">{getOrderAddress(row.original)}</span>
      </Link>
    ),
  },
  {
    id: "client",
    header: "Client",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{row.original.client?.name ?? "—"}</span>
      </div>
    ),
  },
  {
    id: "agent",
    header: "Agent",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{row.original.agent?.name ?? "—"}</span>
      </div>
    ),
  },
  {
    id: "scheduled",
    header: "Scheduled",
    cell: ({ row }) => {
      const date = row.original.scheduled_date;
      const time = row.original.scheduled_time;
      if (!date) return <span className="text-muted-foreground">Unscheduled</span>;
      return (
        <div className="text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            {formatDateShort(date)}
          </div>
          {time && (
            <div className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatTime12(time)}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={getStatusBadgeVariant(row.original.status)} className={cn("font-medium", getStatusBadgeClasses(row.original.status))}>
        {formatStatusLabel(row.original.status)}
      </Badge>
    ),
  },
  {
    accessorKey: "payment_status",
    header: "Payment",
    cell: ({ row }) => (
      <Badge variant="outline" className={cn("font-medium", getPaymentBadgeClasses(row.original.payment_status))}>
        {formatStatusLabel(row.original.payment_status)}
      </Badge>
    ),
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => (
      <div className="flex items-center gap-1 font-medium">
        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
        {row.original.total.toFixed(2)}
      </div>
    ),
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
  const userRole = mockAdminUser.role;

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Orders"
          description="Manage inspection orders - the complete business lifecycle"
          actions={
            can(userRole, "create_inspections") ? (
              <Button asChild>
                <Link href="/admin/orders/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Order
                </Link>
              </Button>
            ) : null
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-2xl">{stats.pending}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Scheduled</CardDescription>
              <CardTitle className="text-2xl">{stats.scheduled}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>In Progress</CardDescription>
              <CardTitle className="text-2xl">{stats.inProgress}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unpaid</CardDescription>
              <CardTitle className="text-2xl text-red-600">{stats.unpaid}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-2xl text-green-600">{stats.completed}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className="text-2xl text-green-600">${stats.totalRevenue.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
              <div className="relative w-full md:flex-1 md:min-w-50">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search orders..." className="pl-9" />
              </div>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full min-w-35 md:w-40">
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
                  <SelectTrigger className="w-full min-w-35 md:w-40">
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
              </div>
              <div className="flex w-full justify-end md:ml-auto md:w-auto">
                <Button
                  variant="ghost"
                  className="w-auto"
                  onClick={() => {
                    setStatusFilter("all");
                    setPaymentFilter("all");
                    setSearchQuery("");
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Orders</CardTitle>
            <CardDescription>{isLoading ? "Loading..." : `${filteredOrders.length} orders`}</CardDescription>
          </CardHeader>
          <CardContent>
            {isError ? (
              <div className="text-red-500">Failed to load orders.</div>
            ) : (
              <>
                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                  {filteredOrders.length === 0 && !isLoading ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">No orders found.</div>
                  ) : (
                    filteredOrders.map((order) => {
                      const inspection = Array.isArray(order.inspection) ? order.inspection[0] : order.inspection;
                      return (
                        <Link
                          key={order.id}
                          href={`/admin/orders/${order.id}`}
                          className="block rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50"
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
                              variant={getStatusBadgeVariant(order.status)}
                              className={cn("font-medium text-[0.65rem] px-2 py-0.5", getStatusBadgeClasses(order.status))}
                            >
                              {formatStatusLabel(order.status)}
                            </Badge>
                            <Badge variant="outline" className={cn("font-medium text-[0.65rem] px-2 py-0.5", getPaymentBadgeClasses(order.payment_status))}>
                              {formatStatusLabel(order.payment_status)}
                            </Badge>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2 text-[0.65rem] text-muted-foreground">
                            <span className="rounded-full border px-2 py-0.5">Agent: {order.agent?.name ?? "Unassigned"}</span>
                            <span className="rounded-full border px-2 py-0.5">Services: {inspection?.services?.length ?? 0}</span>
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

                {/* Desktop View */}
                <div className="hidden md:block">
                  {filteredOrders.length === 0 && !isLoading ? (
                    <div className="rounded-lg border border-dashed p-10 text-center">
                      <h3 className="text-lg font-semibold">No orders yet</h3>
                      <p className="mt-2 text-sm text-muted-foreground">Create your first order to start managing inspections.</p>
                      {can(userRole, "create_inspections") && (
                        <Button asChild className="mt-4">
                          <Link href="/admin/orders/new">Create Order</Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <DataTable columns={columns} data={filteredOrders} searchKey="order_number" searchPlaceholder="Search by order number..." />
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
