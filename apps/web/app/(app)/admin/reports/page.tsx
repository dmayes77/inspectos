"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { useOrders } from "@/hooks/use-orders";
import { useInspections } from "@/hooks/use-inspections";
import { useLeads } from "@/hooks/use-leads";

export default function ReportsPage() {
  const { data: orders = [] } = useOrders();
  const { data: inspections = [] } = useInspections();
  const { data: leads = [] } = useLeads();

  const metrics = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const paidOrders = orders.filter((order) => order.payment_status === "paid");
    const paidRevenue = paidOrders
      .filter((order) => {
        if (!order.scheduled_date) return false;
        return new Date(order.scheduled_date) >= monthStart;
      })
      .reduce((sum, order) => sum + order.total, 0);

    const inspectionVolume = inspections.length;
    const conversionRate = leads.length ? Math.round((orders.length / leads.length) * 100) : 0;
    const outstandingInvoices = orders.filter((order) => order.payment_status === "unpaid").length;

    return { paidRevenue, inspectionVolume, conversionRate, outstandingInvoices };
  }, [inspections.length, leads.length, orders]);

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Reports"
          description="Business performance, revenue, and inspector productivity"
          actions={
            <Button className="sm:w-auto" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Monthly Revenue</p>
              <p className="mt-2 text-2xl font-semibold">${metrics.paidRevenue.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Inspection Volume</p>
              <p className="mt-2 text-2xl font-semibold">{metrics.inspectionVolume}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Conversion Rate</p>
              <p className="mt-2 text-2xl font-semibold">{metrics.conversionRate}%</p>
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
                <p className="text-sm font-medium">Reports dashboard coming next</p>
                <p className="text-xs text-muted-foreground">
                  Outstanding invoices: {metrics.outstandingInvoices}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Paid revenue</Badge>
                <Badge variant="outline">Conversion</Badge>
                <Badge variant="outline">Inspector load</Badge>
              </div>
              <Button variant="link" className="h-auto p-0" asChild>
                <Link href="/admin/orders">
                  Review orders
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
