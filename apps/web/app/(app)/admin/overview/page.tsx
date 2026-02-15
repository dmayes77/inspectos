"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  ClipboardList,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  ArrowRight,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

import { mockAdminUser } from "@inspectos/shared/constants/mock-users";
import { can } from "@/lib/admin/permissions";
import { formatTime12 } from "@inspectos/shared/utils/dates";
import { useOrders } from "@/hooks/use-orders";
import { useClients } from "@/hooks/use-clients";
import { Skeleton } from "@/components/ui/skeleton";

const revenueChartConfig = {
  revenue: { label: "Revenue", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

const volumeChartConfig = {
  orders: { label: "Inspections", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

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
  return [property.address_line1, `${property.city}, ${property.state}`]
    .filter(Boolean)
    .join(" · ");
};

const getServiceSummary = (order: { services?: Array<{ name: string }> | null }) => {
  const services = order.services ?? [];
  if (services.length === 0) return "No services";
  if (services.length === 1) return services[0].name;
  return `${services[0].name} +${services.length - 1}`;
};

type BadgeVariant = "muted" | "info" | "warning" | "success" | "destructive" | "outline";

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  pending: "muted",
  scheduled: "info",
  in_progress: "warning",
  pending_report: "outline",
  delivered: "success",
  completed: "success",
  cancelled: "destructive",
};

export default function OverviewPage() {
  const { data: ordersData, isLoading: ordersLoading } = useOrders();
  const { data: clientsData, isLoading: clientsLoading } = useClients();

  const orders = useMemo(() => ordersData ?? [], [ordersData]);
  const clients = useMemo(() => clientsData ?? [], [clientsData]);

  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((order) => order.scheduled_date === today);

  // Build last-7-days chart data
  const weeklyData = useMemo(() => {
    const days: { label: string; date: string; orders: number; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayOrders = orders.filter((o) => o.scheduled_date === dateStr);
      days.push({
        label,
        date: dateStr,
        orders: dayOrders.length,
        revenue: dayOrders.reduce((s, o) => s + (o.total ?? 0), 0),
      });
    }
    return days;
  }, [orders]);

  const stats = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const thisWeek = orders.filter((o) => o.scheduled_date && new Date(o.scheduled_date) >= weekAgo);
    const lastWeek = orders.filter((o) => {
      if (!o.scheduled_date) return false;
      const d = new Date(o.scheduled_date);
      return d >= twoWeeksAgo && d < weekAgo;
    });

    const revenueThis = thisWeek.reduce((s, o) => s + (o.total ?? 0), 0);
    const revenueLast = lastWeek.reduce((s, o) => s + (o.total ?? 0), 0);
    const revDelta = revenueLast > 0 ? Math.round(((revenueThis - revenueLast) / revenueLast) * 100) : null;

    const countDelta = lastWeek.length > 0 ? thisWeek.length - lastWeek.length : null;

    const outstandingOrders = orders.filter((o) => o.payment_status === "unpaid");
    const outstandingTotal = outstandingOrders.reduce((s, o) => s + (o.total ?? 0), 0);

    return [
      {
        title: "Inspections This Week",
        value: thisWeek.length.toString(),
        delta: countDelta,
        deltaLabel: "vs last week",
        icon: ClipboardList,
      },
      {
        title: "Revenue This Week",
        value: `$${revenueThis.toLocaleString()}`,
        delta: revDelta,
        deltaLabel: "vs last week",
        icon: DollarSign,
      },
      {
        title: "Active Clients",
        value: clients.length.toString(),
        delta: null,
        deltaLabel: "total clients",
        icon: Users,
      },
      {
        title: "Outstanding",
        value: `$${outstandingTotal.toLocaleString()}`,
        delta: null,
        deltaLabel: `${outstandingOrders.length} unpaid`,
        icon: TrendingUp,
      },
    ];
  }, [clients, orders]);

  const recentActivity = useMemo(() => {
    return orders
      .slice()
      .sort((a, b) => (a.updated_at > b.updated_at ? -1 : 1))
      .slice(0, 5)
      .map((order) => ({
        id: order.id,
        action: formatStatusLabel(order.status),
        address: getOrderAddress(order),
        client: order.client?.name ?? "No client",
        time: new Date(order.updated_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
        status: order.status,
      }));
  }, [orders]);

  if (ordersLoading || clientsLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="pt-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2"><CardContent className="pt-5"><Skeleton className="h-48 w-full" /></CardContent></Card>
          <Card><CardContent className="pt-5"><Skeleton className="h-48 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Dashboard"
        description={`Welcome back, ${mockAdminUser.name.split(" ")[0]}.`}
        actions={
          can(mockAdminUser.role, "create_inspections") ? (
            <Button asChild>
              <Link href="/admin/orders/new">
                <Plus className="mr-1.5 h-4 w-4" />
                New Order
              </Link>
            </Button>
          ) : null
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.delta !== null && stat.delta >= 0;
          const isNegative = stat.delta !== null && stat.delta < 0;
          return (
            <Card key={stat.title}>
              <CardContent className="px-6 py-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Icon className="h-4.5 w-4.5 text-muted-foreground" />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-bold tabular-nums tracking-tight">{stat.value}</div>
                <div className="mt-2 flex items-center gap-2">
                  {stat.delta !== null ? (
                    <span className={cn(
                      "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                      isPositive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    )}>
                      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {isPositive ? "+" : ""}{stat.delta}{typeof stat.delta === "number" && stat.title.includes("Revenue") ? "%" : ""}
                    </span>
                  ) : null}
                  <span className="text-xs text-muted-foreground">{stat.deltaLabel}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardDescription>Weekly Revenue</CardDescription>
                <CardTitle className="mt-1 text-2xl tabular-nums">
                  ${weeklyData.reduce((s, d) => s + d.revenue, 0).toLocaleString()}
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px]">Last 7 days</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <ChartContainer config={revenueChartConfig} className="h-[160px] w-full">
              <BarChart data={weeklyData} barSize={22} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
                    />
                  }
                />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardDescription>Inspection Volume</CardDescription>
                <CardTitle className="mt-1 text-2xl tabular-nums">
                  {weeklyData.reduce((s, d) => s + d.orders, 0)}
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px]">Last 7 days</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <ChartContainer config={volumeChartConfig} className="h-[160px] w-full">
              <AreaChart data={weeklyData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-orders)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--color-orders)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="var(--color-orders)"
                  strokeWidth={2}
                  fill="url(#volumeGradient)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Today + activity row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Today&apos;s Schedule
              </CardTitle>
              <CardDescription>{todayOrders.length} order{todayOrders.length !== 1 ? "s" : ""} today</CardDescription>
            </div>
            <Button variant="ghost" asChild className="text-xs">
              <Link href="/admin/orders">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center gap-3 rounded-lg border px-3 py-2.5 hover:bg-muted/50 group transition-colors"
              >
                <div className="shrink-0 w-11 text-right">
                  <span className="text-sm font-semibold tabular-nums">{formatTime12(order.scheduled_time ?? "09:00")}</span>
                </div>
                <div className="w-px self-stretch bg-border" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">{getOrderAddress(order)}</span>
                    <Badge variant={STATUS_VARIANT[order.status] ?? "muted"}>{formatStatusLabel(order.status)}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {order.inspector?.full_name ?? "Unassigned"} · {getServiceSummary(order)}
                  </p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>
            ))}
            {todayOrders.length === 0 && (
              <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                No orders scheduled today.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
            <CardDescription>Latest order updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.map((activity) => (
              <Link
                key={activity.id}
                href={`/admin/orders/${activity.id}`}
                className="flex items-start gap-3 border-l-2 border-border pl-3 hover:border-primary transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">{activity.action} <span className="text-muted-foreground font-normal">· {activity.client}</span></p>
                  <p className="text-xs text-muted-foreground truncate">{activity.address}</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5">{activity.time}</p>
                </div>
              </Link>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-xs text-muted-foreground">No recent activity yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom summary cards */}
      <div className="grid gap-3 md:grid-cols-3">
        <Link href="/admin/orders?status=pending_report">
          <Card className="transition-colors hover:border-primary/50 cursor-pointer">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-medium text-muted-foreground">Pending Reports</p>
              <div className="mt-1.5 text-2xl font-bold">
                {orders.filter((o) => o.status === "pending_report").length}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/invoices">
          <Card className="transition-colors hover:border-primary/50 cursor-pointer">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-medium text-muted-foreground">Outstanding Invoices</p>
              <div className="mt-1.5 text-2xl font-bold">
                ${orders.filter((o) => o.payment_status === "unpaid").reduce((s, o) => s + (o.total ?? 0), 0).toLocaleString()}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {orders.filter((o) => o.payment_status === "unpaid").length} unpaid invoices
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/schedule">
          <Card className="transition-colors hover:border-primary/50 cursor-pointer">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-medium text-muted-foreground">Today&apos;s Inspectors</p>
              <div className="mt-1.5 text-2xl font-bold">
                {new Set(todayOrders.filter((o) => o.inspector?.id).map((o) => o.inspector?.id)).size}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {todayOrders.filter((o) => !o.inspector?.id).length > 0
                  ? `${todayOrders.filter((o) => !o.inspector?.id).length} unassigned`
                  : "All assigned"}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
