"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  ArrowRight,
  Calendar,
  CircleAlert,
  DollarSign,
  Percent,
  Plus,
  ShieldAlert,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import { can } from "@/lib/admin/permissions";
import { useProfile } from "@/hooks/use-profile";
import { formatTime12 } from "@inspectos/shared/utils/dates";
import { useOrders } from "@/hooks/use-orders";
import { useClients } from "@/hooks/use-clients";
import { Skeleton } from "@/components/ui/skeleton";

const decisionTrendConfig = {
  margin: { label: "Margin", color: "var(--color-brand-500)" },
  avgCost: { label: "Avg Cost", color: "var(--color-brand-300)" },
} satisfies ChartConfig;

const referralConfig = {
  margin: { label: "Margin", color: "var(--color-brand-500)" },
} satisfies ChartConfig;

const formatMoney = (value: number) => `$${Math.round(value).toLocaleString()}`;

const getOrderAddress = (order: {
  property?: {
    address_line1?: string;
    city?: string;
    state?: string;
  };
}) => {
  const property = order.property;
  if (!property) return "Property unavailable";
  return [property.address_line1, `${property.city}, ${property.state}`].filter(Boolean).join(" · ");
};

const getOrderTotalCost = (order: {
  total_cost?: number;
  labor_cost?: number;
  travel_cost?: number;
  overhead_cost?: number;
  other_cost?: number;
}) => {
  if (typeof order.total_cost === "number") return order.total_cost;
  return (order.labor_cost ?? 0) + (order.travel_cost ?? 0) + (order.overhead_cost ?? 0) + (order.other_cost ?? 0);
};

const getOrderGrossMargin = (order: {
  gross_margin?: number;
  total?: number;
  total_cost?: number;
  labor_cost?: number;
  travel_cost?: number;
  overhead_cost?: number;
  other_cost?: number;
}) => {
  if (typeof order.gross_margin === "number") return order.gross_margin;
  return (order.total ?? 0) - getOrderTotalCost(order);
};

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export default function OverviewPage() {
  const { data: profile } = useProfile();
  const { data: ordersData, isLoading: ordersLoading } = useOrders();
  const { data: clientsData, isLoading: clientsLoading } = useClients();

  const orders = useMemo(() => ordersData ?? [], [ordersData]);
  const clients = useMemo(() => clientsData ?? [], [clientsData]);

  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = useMemo(() => orders.filter((order) => order.scheduled_date === today), [orders, today]);

  const decisionData = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const this30 = orders.filter((order) => {
      const date = parseDate(order.scheduled_date ?? order.created_at);
      return Boolean(date && date >= thirtyDaysAgo);
    });

    const prior30 = orders.filter((order) => {
      const date = parseDate(order.scheduled_date ?? order.created_at);
      return Boolean(date && date >= sixtyDaysAgo && date < thirtyDaysAgo);
    });

    const computeTotals = (source: typeof orders) => {
      const revenue = source.reduce((sum, order) => sum + (order.total ?? 0), 0);
      const cost = source.reduce((sum, order) => sum + getOrderTotalCost(order), 0);
      const margin = source.reduce((sum, order) => sum + getOrderGrossMargin(order), 0);
      return { revenue, cost, margin };
    };

    const thisTotals = computeTotals(this30);
    const priorTotals = computeTotals(prior30);

    const marginPct = thisTotals.revenue > 0 ? (thisTotals.margin / thisTotals.revenue) * 100 : 0;
    const priorMarginPct = priorTotals.revenue > 0 ? (priorTotals.margin / priorTotals.revenue) * 100 : 0;
    const marginDelta = priorTotals.margin > 0 ? ((thisTotals.margin - priorTotals.margin) / priorTotals.margin) * 100 : null;
    const marginRateDelta = priorMarginPct > 0 ? marginPct - priorMarginPct : null;

    const avgCostPerInspection = this30.length > 0 ? thisTotals.cost / this30.length : 0;

    const lowMarginOrders = this30
      .map((order) => {
        const margin = getOrderGrossMargin(order);
        const revenue = order.total ?? 0;
        const marginPctForOrder = revenue > 0 ? (margin / revenue) * 100 : 0;
        return {
          id: order.id,
          orderNumber: order.order_number,
          scheduledDate: order.scheduled_date,
          address: getOrderAddress(order),
          margin,
          marginPct: marginPctForOrder,
          source: order.source?.trim() || "Unknown",
        };
      })
      .filter((order) => order.marginPct < 25)
      .sort((a, b) => a.marginPct - b.marginPct)
      .slice(0, 6);

    const atRiskMargin = lowMarginOrders.reduce((sum, order) => sum + order.margin, 0);

    const serviceMetrics = new Map<string, { service: string; inspections: number; revenue: number; margin: number }>();
    const referralMetrics = new Map<string, { source: string; inspections: number; revenue: number; margin: number }>();

    this30.forEach((order) => {
      const orderRevenue = order.total ?? 0;
      const orderMargin = getOrderGrossMargin(order);
      const source = order.source?.trim() || "Unknown";

      const referralRow = referralMetrics.get(source) ?? { source, inspections: 0, revenue: 0, margin: 0 };
      referralRow.inspections += 1;
      referralRow.revenue += orderRevenue;
      referralRow.margin += orderMargin;
      referralMetrics.set(source, referralRow);

      const services = order.services?.length ? order.services : [{ name: "Unassigned Service", price: orderRevenue }];
      const totalServicePrice = services.reduce((sum, service) => sum + (service.price ?? 0), 0);
      const fallbackShare = services.length > 0 ? 1 / services.length : 1;

      services.forEach((service) => {
        const name = service.name?.trim() || "Unnamed Service";
        const share = totalServicePrice > 0 ? (service.price ?? 0) / totalServicePrice : fallbackShare;
        const serviceRevenue = orderRevenue * share;
        const serviceMargin = orderMargin * share;

        const row = serviceMetrics.get(name) ?? { service: name, inspections: 0, revenue: 0, margin: 0 };
        row.inspections += 1;
        row.revenue += serviceRevenue;
        row.margin += serviceMargin;
        serviceMetrics.set(name, row);
      });
    });

    const serviceLeaderboard = Array.from(serviceMetrics.values())
      .map((service) => ({
        ...service,
        marginPct: service.revenue > 0 ? (service.margin / service.revenue) * 100 : 0,
      }))
      .sort((a, b) => b.margin - a.margin);

    const topServices = serviceLeaderboard.slice(0, 5);
    const bottomServices = [...serviceLeaderboard]
      .sort((a, b) => a.marginPct - b.marginPct)
      .slice(0, 5);

    const referralLeaderboard = Array.from(referralMetrics.values())
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 6);

    const weekStarts: Date[] = [];
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(startOfToday);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() - i * 7);
      weekStarts.push(weekStart);
    }

    const trendBuckets = weekStarts.map((weekStart) => ({
      label: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      orders: 0,
      revenue: 0,
      cost: 0,
      margin: 0,
      avgCost: 0,
    }));

    this30.forEach((order) => {
      const scheduled = parseDate(order.scheduled_date ?? order.created_at);
      if (!scheduled) return;
      for (let i = 0; i < trendBuckets.length; i++) {
        const start = weekStarts[i];
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        if (scheduled >= start && scheduled < end) {
          trendBuckets[i].orders += 1;
          trendBuckets[i].revenue += order.total ?? 0;
          trendBuckets[i].cost += getOrderTotalCost(order);
          trendBuckets[i].margin += getOrderGrossMargin(order);
          break;
        }
      }
    });

    trendBuckets.forEach((bucket) => {
      bucket.avgCost = bucket.orders > 0 ? bucket.cost / bucket.orders : 0;
    });

    return {
      kpis: {
        margin: thisTotals.margin,
        marginDelta,
        marginRate: marginPct,
        marginRateDelta,
        avgCostPerInspection,
        atRiskMargin,
        atRiskCount: lowMarginOrders.length,
        inspectionCount: this30.length,
      },
      trendBuckets,
      referralLeaderboard,
      topServices,
      bottomServices,
      lowMarginOrders,
    };
  }, [orders]);

  if (ordersLoading || clientsLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}><CardContent className="pt-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <Card><CardContent className="pt-4"><Skeleton className="h-56 w-full" /></CardContent></Card>
          <Card><CardContent className="pt-4"><Skeleton className="h-56 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  const greetingName = (profile?.full_name || profile?.email || "").split(" ")[0];

  return (
    <div className="space-y-3">
      <AdminPageHeader
        title="Owner Command Center"
        description={`Margin-first view for ${greetingName}. Use this to price, cut, and scale with confidence.`}
        actions={
          can(profile?.role ?? "owner", "create_inspections") ? (
            <Button asChild>
              <Link href="/admin/orders/new">
                <Plus className="mr-1.5 h-4 w-4" />
                New Order
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          label="Gross Margin (30d)"
          value={formatMoney(decisionData.kpis.margin)}
          icon={DollarSign}
          trend={decisionData.kpis.marginDelta ? Math.round(decisionData.kpis.marginDelta) : null}
          trendLabel={decisionData.kpis.marginDelta ? `${decisionData.kpis.marginDelta >= 0 ? "+" : ""}${Math.round(decisionData.kpis.marginDelta)}%` : undefined}
          sublabel="vs prior 30 days"
        />
        <StatCard
          label="Margin Rate"
          value={`${decisionData.kpis.marginRate.toFixed(1)}%`}
          icon={Percent}
          trend={decisionData.kpis.marginRateDelta ? Math.round(decisionData.kpis.marginRateDelta * 10) / 10 : null}
          trendLabel={decisionData.kpis.marginRateDelta ? `${decisionData.kpis.marginRateDelta >= 0 ? "+" : ""}${decisionData.kpis.marginRateDelta.toFixed(1)} pts` : undefined}
          sublabel="gross margin %"
        />
        <StatCard
          label="Cost / Inspection"
          value={formatMoney(decisionData.kpis.avgCostPerInspection)}
          icon={CircleAlert}
          sublabel="30-day average"
        />
        <StatCard
          label="Low-Margin Orders"
          value={decisionData.kpis.atRiskCount}
          icon={ShieldAlert}
          sublabel={`${formatMoney(decisionData.kpis.atRiskMargin)} margin at risk`}
        />
        <StatCard
          label="Active Clients"
          value={clients.length}
          icon={Users}
          sublabel={`${decisionData.kpis.inspectionCount} inspections in 30d`}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Margin vs Cost Trend</CardTitle>
            <CardDescription>Weekly margin dollars against average cost per inspection</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-2">
            <ChartContainer config={decisionTrendConfig} className="h-[200px] w-full">
              <LineChart data={decisionData.trendBuckets} margin={{ top: 4, right: 6, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value, key) => [formatMoney(Number(value)), key === "margin" ? "Margin" : "Avg Cost"]}
                    />
                  }
                />
                <Line type="monotone" dataKey="margin" stroke="var(--color-margin)" strokeWidth={2.2} dot={false} />
                <Line type="monotone" dataKey="avgCost" stroke="var(--color-avgCost)" strokeWidth={2} dot={false} strokeDasharray="5 3" />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Referral Value (30d)</CardTitle>
            <CardDescription>Margin contribution by source</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-2">
            <ChartContainer config={referralConfig} className="h-[200px] w-full">
              <BarChart data={decisionData.referralLeaderboard} layout="vertical" margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                <YAxis
                  type="category"
                  dataKey="source"
                  tickLine={false}
                  axisLine={false}
                  width={90}
                  tick={{ fontSize: 10 }}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent formatter={(value) => [formatMoney(Number(value)), "Margin"]} />}
                />
                <Bar dataKey="margin" fill="var(--color-margin)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Service Margin Leaderboard</CardTitle>
            <CardDescription>Highest and lowest margin services in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top Margin Services</p>
              {decisionData.topServices.map((service) => (
                <div key={`top-${service.service}`} className="rounded-lg border px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{service.service}</p>
                    <Badge color="success">{service.marginPct.toFixed(1)}%</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatMoney(service.margin)} margin · {service.inspections} inspections
                  </p>
                </div>
              ))}
              {decisionData.topServices.length === 0 && (
                <p className="text-xs text-muted-foreground">No service margin data yet.</p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Margin Risk Services</p>
              {decisionData.bottomServices.map((service) => (
                <div key={`bottom-${service.service}`} className="rounded-lg border px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{service.service}</p>
                    <Badge color={service.marginPct < 15 ? "error" : "warning"}>{service.marginPct.toFixed(1)}%</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatMoney(service.margin)} margin · {service.inspections} inspections
                  </p>
                </div>
              ))}
              {decisionData.bottomServices.length === 0 && (
                <p className="text-xs text-muted-foreground">No service margin data yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Margin Leak Alerts</CardTitle>
            <CardDescription>Orders below 25% gross margin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {decisionData.lowMarginOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{order.orderNumber || "Order"} · {order.address}</p>
                  <p className="text-xs text-muted-foreground">{order.scheduledDate || "No date"} · {order.source}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Margin</p>
                  <p className="text-sm font-semibold">{order.marginPct.toFixed(1)}%</p>
                </div>
              </Link>
            ))}
            {decisionData.lowMarginOrders.length === 0 && (
              <p className="text-xs text-muted-foreground">No low-margin alerts in the last 30 days.</p>
            )}
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/orders">
                Open Orders
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Today&apos;s Schedule
            </CardTitle>
            <CardDescription>{todayOrders.length} order{todayOrders.length !== 1 ? "s" : ""} scheduled today</CardDescription>
          </div>
          <Button variant="ghost" asChild className="text-xs">
            <Link href="/admin/orders">
              View all
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {todayOrders.slice(0, 4).map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{getOrderAddress(order)}</p>
                <p className="text-xs text-muted-foreground">{order.client?.name ?? "No client"}</p>
              </div>
              <p className="text-sm font-semibold tabular-nums">{formatTime12(order.scheduled_time ?? "09:00")}</p>
            </Link>
          ))}
          {todayOrders.length === 0 && (
            <div className="rounded-lg border border-dashed px-3 py-5 text-center text-sm text-muted-foreground">
              No orders scheduled today.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
