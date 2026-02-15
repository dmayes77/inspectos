"use client";

import { useMemo, useCallback } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Download, ArrowRight, FileSpreadsheet, DollarSign, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrders } from "@/hooks/use-orders";
import { useInspections } from "@/hooks/use-inspections";
import { useLeads } from "@/hooks/use-leads";
import { useClients } from "@/hooks/use-clients";
import { toast } from "sonner";

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { data: orders = [] } = useOrders();
  const { data: inspections = [] } = useInspections();
  const { data: leads = [] } = useLeads();
  const { data: clients = [] } = useClients();

  const metrics = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    const paidOrders = orders.filter((order) => order.payment_status === "paid");
    const monthlyRevenue = paidOrders
      .filter((order) => {
        if (!order.scheduled_date) return false;
        return new Date(order.scheduled_date) >= monthStart;
      })
      .reduce((sum, order) => sum + order.total, 0);

    const weeklyRevenue = paidOrders
      .filter((order) => {
        if (!order.scheduled_date) return false;
        return new Date(order.scheduled_date) >= weekStart;
      })
      .reduce((sum, order) => sum + order.total, 0);

    const inspectionVolume = inspections.length;
    const conversionRate = leads.length ? Math.round((orders.length / leads.length) * 100) : 0;
    const outstandingInvoices = orders.filter((order) => order.payment_status === "unpaid").length;
    const outstandingAmount = orders
      .filter((order) => order.payment_status === "unpaid")
      .reduce((sum, order) => sum + order.total, 0);

    const completedThisMonth = orders.filter((order) => {
      if (!order.scheduled_date) return false;
      return new Date(order.scheduled_date) >= monthStart && order.status === "completed";
    }).length;

    return {
      monthlyRevenue,
      weeklyRevenue,
      inspectionVolume,
      conversionRate,
      outstandingInvoices,
      outstandingAmount,
      completedThisMonth,
      totalClients: clients.length,
    };
  }, [inspections.length, leads.length, orders, clients.length]);

  const exportOrders = useCallback(() => {
    const headers = [
      "Order Number",
      "Status",
      "Client",
      "Property Address",
      "Scheduled Date",
      "Scheduled Time",
      "Inspector",
      "Total",
      "Payment Status",
      "Created At",
    ];
    const rows = orders.map((order) => [
      order.order_number,
      order.status,
      order.client?.name ?? "",
      order.property?.address_line1 ?? "",
      order.scheduled_date ?? "",
      order.scheduled_time ?? "",
      order.inspector?.full_name ?? "",
      order.total.toFixed(2),
      order.payment_status,
      order.created_at,
    ]);
    downloadCSV(`orders-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    toast.success(`Exported ${orders.length} orders`);
  }, [orders]);

  const exportClients = useCallback(() => {
    const headers = ["Name", "Email", "Phone", "Type", "Total Spent", "Inspections"];
    const rows = clients.map((client) => [
      client.name,
      client.email ?? "",
      client.phone ?? "",
      client.type ?? "",
      client.totalSpent?.toFixed(2) ?? "0.00",
      String(client.inspections ?? 0),
    ]);
    downloadCSV(`clients-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    toast.success(`Exported ${clients.length} clients`);
  }, [clients]);

  const exportRevenue = useCallback(() => {
    const headers = ["Order Number", "Client", "Scheduled Date", "Total", "Payment Status", "Paid"];
    const rows = orders.map((order) => [
      order.order_number,
      order.client?.name ?? "",
      order.scheduled_date ?? "",
      order.total.toFixed(2),
      order.payment_status,
      order.payment_status === "paid" ? "Yes" : "No",
    ]);
    downloadCSV(`revenue-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    toast.success(`Exported revenue data for ${orders.length} orders`);
  }, [orders]);

  return (
    <>
    <div className="space-y-6">
      <AdminPageHeader
        title="Reports"
        description="Business performance, revenue, and inspector productivity"
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="sm:w-auto" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Data</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportOrders}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Orders ({orders.length})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportClients}>
                <Users className="mr-2 h-4 w-4" />
                Clients ({clients.length})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportRevenue}>
                <DollarSign className="mr-2 h-4 w-4" />
                Revenue Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Monthly Revenue</p>
            </div>
            <p className="mt-2 text-2xl font-semibold">${metrics.monthlyRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              ${metrics.weeklyRevenue.toLocaleString()} this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Inspection Volume</p>
            </div>
            <p className="mt-2 text-2xl font-semibold">{metrics.inspectionVolume}</p>
            <p className="text-xs text-muted-foreground">
              {metrics.completedThisMonth} completed this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Conversion Rate</p>
            </div>
            <p className="mt-2 text-2xl font-semibold">{metrics.conversionRate}%</p>
            <p className="text-xs text-muted-foreground">
              {leads.length} leads → {orders.length} orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Active Clients</p>
            </div>
            <p className="mt-2 text-2xl font-semibold">{metrics.totalClients}</p>
            <p className="text-xs text-muted-foreground">
              {metrics.outstandingInvoices} with outstanding balance
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Outstanding Balance</CardTitle>
            <CardDescription>Unpaid invoices requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${metrics.outstandingAmount.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {metrics.outstandingInvoices} unpaid invoices
            </p>
            <Button variant="link" className="mt-4 h-auto p-0" asChild>
              <Link href="/admin/orders?payment_status=unpaid">
                View unpaid orders
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common reporting tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={exportOrders}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export all orders to CSV
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={exportRevenue}>
              <DollarSign className="mr-2 h-4 w-4" />
              Export revenue report
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/admin/invoices">
                <TrendingUp className="mr-2 h-4 w-4" />
                View invoice summary
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>Visualize trends across your business.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Charts and graphs coming soon</p>
              <p className="text-xs text-muted-foreground">
                Revenue trends, inspector performance, and conversion funnels
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Revenue trends</Badge>
              <Badge variant="outline">Inspector load</Badge>
              <Badge variant="outline">Conversion funnel</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
