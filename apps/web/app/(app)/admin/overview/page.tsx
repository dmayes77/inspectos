"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Plus,
} from "lucide-react";

import { mockAdminUser } from "@/lib/constants/mock-users";
import { can } from "@/lib/admin/permissions";
import { formatTime12 } from "@/lib/utils/dates";
import { useOrders } from "@/hooks/use-orders";
import { useClients } from "@/hooks/use-clients";
import { Skeleton } from "@/components/ui/skeleton";

const formatStatusLabel = (status?: string | null) => {
  if (!status) return "—";
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getOrderAddress = (order: {
  property?: {
    address_line1?: string;
    address_line2?: string | null;
    city?: string;
    state?: string;
    zip_code?: string;
  };
}) => {
  const property = order.property;
  if (!property) return "Property unavailable";
  return [
    property.address_line1,
    property.address_line2,
    `${property.city}, ${property.state} ${property.zip_code}`,
  ]
    .filter(Boolean)
    .join(", ");
};

const getServiceSummary = (order: { inspection?: { services?: Array<{ name: string }> } | Array<{ services?: Array<{ name: string }> }> | null }) => {
  const inspection = Array.isArray(order.inspection) ? order.inspection[0] : order.inspection;
  const services = inspection?.services ?? [];
  if (services.length === 0) return "No services";
  if (services.length === 1) return services[0].name;
  return `${services[0].name} +${services.length - 1}`;
};

export default function OverviewPage() {
  const { data: ordersData, isLoading: ordersLoading } = useOrders();
  const { data: clientsData, isLoading: clientsLoading } = useClients();

  const orders = useMemo(() => ordersData ?? [], [ordersData]);
  const clients = useMemo(() => clientsData ?? [], [clientsData]);

  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((order) => order.scheduled_date === today);

  const stats = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const inspectionsThisWeek = orders.filter((order) => {
      if (!order.scheduled_date) return false;
      const date = new Date(order.scheduled_date);
      return date >= weekAgo;
    }).length;

    const revenueThisWeek = orders
      .filter((order) => order.scheduled_date && new Date(order.scheduled_date) >= weekAgo)
      .reduce((sum, order) => sum + order.total, 0);

    const outstandingOrders = orders.filter((order) => order.payment_status === "unpaid");
    const outstandingTotal = outstandingOrders.reduce((sum, order) => sum + order.total, 0);
    const outstandingCount = outstandingOrders.length;

    return [
      {
        title: "Inspections This Week",
        value: inspectionsThisWeek.toString(),
        change: ordersLoading ? "—" : "Updated",
        changeType: "positive" as const,
        icon: ClipboardList,
      },
      {
        title: "Revenue This Week",
        value: `$${revenueThisWeek.toLocaleString()}`,
        change: ordersLoading ? "—" : "Updated",
        changeType: "positive" as const,
        icon: DollarSign,
      },
      {
        title: "Active Clients",
        value: clients.length.toString(),
        change: ordersLoading ? "—" : "Updated",
        changeType: "positive" as const,
        icon: Users,
      },
      {
        title: "Outstanding Invoices",
        value: `$${outstandingTotal.toLocaleString()}`,
        change: outstandingCount ? `${outstandingCount} unpaid` : "All caught up",
        changeType: "positive" as const,
        icon: TrendingUp,
      },
    ];
  }, [clients, orders, ordersLoading]);

  const recentActivity = useMemo(() => {
    return orders
      .slice()
      .sort((a, b) => (a.updated_at > b.updated_at ? -1 : 1))
      .slice(0, 4)
      .map((order) => ({
        id: order.id,
        action: `Order ${formatStatusLabel(order.status)}`,
        details: `${getOrderAddress(order)} • ${order.client?.name ?? "No client"}`,
        time: new Date(order.updated_at).toLocaleString(),
      }));
  }, [orders]);

  // Show loading skeleton while data is being fetched
  if (ordersLoading || clientsLoading) {
    return (
      <AdminShell user={mockAdminUser}>
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-64" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <Skeleton className="h-8 w-8" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start gap-3 border-b pb-4 last:border-0">
                      <Skeleton className="h-2 w-2 rounded-full mt-2" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-3 w-40 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Dashboard"
          description={`Welcome back, ${mockAdminUser.name.split(" ")[0]}. Here's what's happening today.`}
          actions={
            can(mockAdminUser.role, "create_inspections") ? (
              <Button asChild className="sm:w-auto">
                <Link href="/admin/orders/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Order
                </Link>
              </Button>
            ) : null
          }
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="h-full">
              <CardHeader className="min-h-[3.5rem] pb-2">
                <CardTitle className="text-sm font-medium leading-snug text-muted-foreground">
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                <div className="text-xl font-bold tabular-nums sm:text-2xl">{stat.value}</div>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  <span className={stat.changeType === "positive" ? "text-green-600" : "text-red-600"}>
                    {stat.change}
                  </span>{" "}
                  from last week
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today&apos;s Orders
                </CardTitle>
                <CardDescription>{todayOrders.length} orders scheduled for today</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/orders">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formatTime12(order.scheduled_time ?? "09:00")}
                          </span>
                          <Badge variant="outline">{formatStatusLabel(order.status)}</Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground break-words">
                          <MapPin className="h-3 w-3" />
                          {getOrderAddress(order)}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                          <span className="text-muted-foreground">
                            {order.inspector?.full_name ?? "Unassigned"}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {getServiceSummary(order)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/orders/${order.id}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
                {todayOrders.length === 0 && (
                  <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                    No orders scheduled today.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 border-b pb-4 last:border-0 last:pb-0">
                    <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium break-words">{activity.action}</p>
                      <p className="text-sm text-muted-foreground break-all">{activity.details}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <p className="text-sm text-muted-foreground">No recent activity yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders.filter((order) => order.status === "pending_report").length}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting review and delivery</p>
              <Button variant="link" className="mt-2 h-auto p-0" asChild>
                <Link href="/admin/orders?status=pending_report">View pending →</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${orders.filter((order) => order.payment_status === "unpaid").reduce((sum, order) => sum + order.total, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {orders.filter((order) => order.payment_status === "unpaid").length} invoices unpaid
              </p>
              <Button variant="link" className="mt-2 h-auto p-0" asChild>
                <Link href="/admin/invoices">View invoices →</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Today&apos;s Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayOrders.length}</div>
              <p className="text-xs text-muted-foreground">
                {(() => {
                  const assignedInspectors = new Set(
                    todayOrders
                      .filter((o) => o.inspector?.id)
                      .map((o) => o.inspector?.id)
                  );
                  const unassigned = todayOrders.filter((o) => !o.inspector?.id).length;
                  if (assignedInspectors.size === 0 && unassigned === 0) {
                    return "No orders scheduled";
                  }
                  const parts = [];
                  if (assignedInspectors.size > 0) {
                    parts.push(`${assignedInspectors.size} inspector${assignedInspectors.size > 1 ? "s" : ""} working`);
                  }
                  if (unassigned > 0) {
                    parts.push(`${unassigned} unassigned`);
                  }
                  return parts.join(" • ");
                })()}
              </p>
              <Button variant="link" className="mt-2 h-auto p-0" asChild>
                <Link href="/admin/schedule">View schedule →</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
