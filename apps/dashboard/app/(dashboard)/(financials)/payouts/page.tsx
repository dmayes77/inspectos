"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  Download,
  Calculator,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Calendar,
  FileText,
  Settings,
} from "lucide-react";
import { usePayouts, usePayRules } from "@/hooks/use-payouts";
import { formatDate } from "@inspectos/shared/utils/dates";
import { ModernDataTable } from "@/components/ui/modern-data-table";

function getStatusBadge(status?: string | null) {
  if (!status) {
    return <Badge color="light">Unknown</Badge>;
  }
  switch (status) {
    case "pending":
      return (
        <Badge color="light" className="bg-gray-100 text-gray-800">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      );
    case "approved":
      return (
        <Badge color="light" className="bg-brand-100 text-brand-700">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Approved
        </Badge>
      );
    case "processing":
      return (
        <Badge color="light" className="bg-amber-100 text-amber-800">
          <AlertCircle className="mr-1 h-3 w-3" />
          Processing
        </Badge>
      );
    case "paid":
      return (
        <Badge color="light" className="bg-green-100 text-green-800">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Paid
        </Badge>
      );
    default:
      return <Badge color="light">{status}</Badge>;
  }
}

function formatPeriodLabel(start: string, end: string) {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function formatPayRuleValue(rule: {
  rule_type: "percentage" | "flat_rate" | "hourly";
  percentage: number | null;
  flat_amount: number | null;
  hourly_rate: number | null;
}) {
  switch (rule.rule_type) {
    case "percentage":
      return `${rule.percentage ?? 0}%`;
    case "flat_rate":
      return `$${(rule.flat_amount ?? 0).toFixed(2)}`;
    case "hourly":
      return `$${(rule.hourly_rate ?? 0).toFixed(2)}/hr`;
    default:
      return "—";
  }
}

export default function PayoutsPage() {
  const { data: payoutsData, isLoading, isError } = usePayouts();
  const { data: payRulesData, isLoading: isRulesLoading, isError: isRulesError } = usePayRules();
  const payouts = payoutsData ?? [];
  const payRules = payRulesData ?? [];
  const [periodFilter, setPeriodFilter] = useState("current");
  const [statusFilter, setStatusFilter] = useState("all");

  const periodKeys = useMemo(() => {
    const sorted = [...payouts].sort(
      (a, b) => new Date(b.period_end).getTime() - new Date(a.period_end).getTime()
    );
    const keys: string[] = [];
    sorted.forEach((payout) => {
      const key = `${payout.period_start}|${payout.period_end}`;
      if (!keys.includes(key)) {
        keys.push(key);
      }
    });
    return keys;
  }, [payouts]);

  const currentPeriodKey = periodKeys[0];
  const lastPeriodKey = periodKeys[1];

  const filteredPayouts = useMemo(() => {
    return payouts.filter((payout) => {
      if (statusFilter !== "all" && payout.status !== statusFilter) return false;

      if (periodFilter === "current" && currentPeriodKey) {
        return `${payout.period_start}|${payout.period_end}` === currentPeriodKey;
      }

      if (periodFilter === "last" && lastPeriodKey) {
        return `${payout.period_start}|${payout.period_end}` === lastPeriodKey;
      }

      return true;
    });
  }, [payouts, statusFilter, periodFilter, currentPeriodKey, lastPeriodKey]);

  const payoutColumns = useMemo<ColumnDef<(typeof filteredPayouts)[number]>[]>(
    () => [
      {
        accessorKey: "inspector",
        enableSorting: false,
        header: "Inspector",
        cell: ({ row }) => {
          const payout = row.original;
          const inspectorName =
            payout.inspector?.full_name ?? payout.inspector?.email ?? "Unassigned";
          return (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{inspectorName}</p>
                {payout.inspector?.email && (
                  <p className="text-sm text-muted-foreground">{payout.inspector.email}</p>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "period",
        enableSorting: false,
        header: "Period",
        cell: ({ row }) => {
          const payout = row.original;
          return (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {formatPeriodLabel(payout.period_start, payout.period_end)}
            </div>
          );
        },
      },
      {
        accessorKey: "items_count",
        enableSorting: false,
        header: "Items",
      },
      {
        accessorKey: "gross_amount",
        enableSorting: false,
        header: "Gross",
        cell: ({ row }) => <div className="text-right">${row.original.gross_amount.toFixed(2)}</div>,
      },
      {
        accessorKey: "deductions",
        enableSorting: false,
        header: "Deductions",
        cell: ({ row }) => (
          <div className="text-right text-red-600">
            {row.original.deductions > 0 ? `-$${row.original.deductions.toFixed(2)}` : "—"}
          </div>
        ),
      },
      {
        accessorKey: "net_amount",
        enableSorting: false,
        header: "Net",
        cell: ({ row }) => <div className="text-right font-medium">${row.original.net_amount.toFixed(2)}</div>,
      },
      {
        accessorKey: "status",
        enableSorting: false,
        header: "Status",
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        id: "actions",
        enableSorting: false,
        header: "",
        cell: () => (
          <Button variant="ghost">
            <FileText className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    []
  );

  const payRuleColumns = useMemo<ColumnDef<(typeof payRules)[number]>[]>(
    () => [
      {
        accessorKey: "name",
        enableSorting: false,
        header: "Rule Name",
        cell: ({ row }) => {
          const rule = row.original;
          return (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{rule.name}</span>
              {rule.is_default && <Badge color="light">Default</Badge>}
            </div>
          );
        },
      },
      {
        accessorKey: "rule_type",
        enableSorting: false,
        header: "Type",
        cell: ({ row }) => <span className="capitalize">{row.original.rule_type.replace("_", " ")}</span>,
      },
      {
        accessorKey: "value",
        enableSorting: false,
        header: "Value",
        cell: ({ row }) => formatPayRuleValue(row.original),
      },
      {
        accessorKey: "applies_to",
        enableSorting: false,
        header: "Applies To",
        cell: ({ row }) => <span className="capitalize">{row.original.applies_to}</span>,
      },
      {
        accessorKey: "is_active",
        enableSorting: false,
        header: "Status",
        cell: ({ row }) => (
          <Badge color={row.original.is_active ? "primary" : "light"}>
            {row.original.is_active ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        header: "",
        cell: () => <Button variant="ghost">Edit</Button>,
      },
    ],
    [payRules]
  );

  // Stats
  const pendingTotal = payouts
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.net_amount, 0);
  const approvedTotal = payouts
    .filter((p) => p.status === "approved")
    .reduce((sum, p) => sum + p.net_amount, 0);
  const paidThisMonth = payouts
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.net_amount, 0);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Payouts"
        description="Track inspector compensation and manage payroll"
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button>
              <Calculator className="mr-2 h-4 w-4" />
              Calculate Payouts
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Pending Payouts" value={`$${pendingTotal.toLocaleString()}`} />
        <StatCard label="Approved (Ready to Pay)" value={`$${approvedTotal.toLocaleString()}`} />
        <StatCard label="Paid This Month" value={`$${paidThisMonth.toLocaleString()}`} />
        <StatCard label="Active Pay Rules" value={payRules.filter((r) => r.is_active).length} />
      </div>

      <Tabs defaultValue="payouts">
        <TabsList>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="rules">Pay Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="payouts" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-3">
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="w-45">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current Period</SelectItem>
                    <SelectItem value="last">Last Period</SelectItem>
                    <SelectItem value="all">All Periods</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-45">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Payouts Table */}
          {isError ? (
            <Card>
              <CardContent className="py-6">
                <div className="text-red-500">Failed to load payouts.</div>
              </CardContent>
            </Card>
          ) : (
            <ModernDataTable
              columns={payoutColumns}
              data={filteredPayouts}
              title="Inspector Payouts"
              description="Review and process inspector compensation"
              isLoading={isLoading}
              emptyState={
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No payouts found for this period.
                </div>
              }
              loadingState={<div className="text-sm text-muted-foreground">Loading payouts...</div>}
            />
          )}
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          {isRulesError ? (
            <Card>
              <CardContent className="py-6">
                <div className="text-red-500">Failed to load pay rules.</div>
              </CardContent>
            </Card>
          ) : (
            <ModernDataTable
              columns={payRuleColumns}
              data={payRules}
              title="Pay Rules"
              description="Configure how inspector compensation is calculated"
              isLoading={isRulesLoading}
              headerActions={
                <Button>
                  <Settings className="mr-2 h-4 w-4" />
                  Add Rule
                </Button>
              }
              emptyState={
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No pay rules configured yet.
                </div>
              }
              loadingState={<div className="text-sm text-muted-foreground">Loading pay rules...</div>}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
