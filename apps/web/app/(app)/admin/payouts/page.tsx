"use client";

import { useMemo, useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { mockAdminUser } from "@inspectos/shared/constants/mock-users";
import { usePayouts, usePayRules } from "@/hooks/use-payouts";
import { formatDate } from "@inspectos/shared/utils/dates";

function getStatusBadge(status?: string | null) {
  if (!status) {
    return <Badge variant="outline">Unknown</Badge>;
  }
  switch (status) {
    case "pending":
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      );
    case "approved":
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Approved
        </Badge>
      );
    case "processing":
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
          <AlertCircle className="mr-1 h-3 w-3" />
          Processing
        </Badge>
      );
    case "paid":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Paid
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
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
    <AdminShell user={mockAdminUser}>
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
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Payouts</CardDescription>
              <CardTitle className="text-2xl text-amber-600">
                ${pendingTotal.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Approved (Ready to Pay)</CardDescription>
              <CardTitle className="text-2xl text-blue-600">
                ${approvedTotal.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Paid This Month</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                ${paidThisMonth.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Pay Rules</CardDescription>
              <CardTitle className="text-2xl">
                {payRules.filter((r) => r.is_active).length}
              </CardTitle>
            </CardHeader>
          </Card>
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
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Current Period</SelectItem>
                      <SelectItem value="last">Last Period</SelectItem>
                      <SelectItem value="all">All Periods</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
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
            <Card>
              <CardHeader>
                <CardTitle>Inspector Payouts</CardTitle>
                <CardDescription>
                  Review and process inspector compensation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isError ? (
                  <div className="text-red-500">Failed to load payouts.</div>
                ) : isLoading ? (
                  <div className="text-sm text-muted-foreground">Loading payouts...</div>
                ) : filteredPayouts.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No payouts found for this period.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Inspector</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                        <TableHead className="text-right">Deductions</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayouts.map((payout) => {
                        const inspectorName =
                          payout.inspector?.full_name ?? payout.inspector?.email ?? "Unassigned";
                        return (
                          <TableRow key={payout.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{inspectorName}</p>
                                  {payout.inspector?.email && (
                                    <p className="text-sm text-muted-foreground">
                                      {payout.inspector.email}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                {formatPeriodLabel(payout.period_start, payout.period_end)}
                              </div>
                            </TableCell>
                            <TableCell>{payout.items_count}</TableCell>
                            <TableCell className="text-right">
                              ${payout.gross_amount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-red-600">
                              {payout.deductions > 0
                                ? `-$${payout.deductions.toFixed(2)}`
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${payout.net_amount.toFixed(2)}
                            </TableCell>
                            <TableCell>{getStatusBadge(payout.status)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                <FileText className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pay Rules</CardTitle>
                    <CardDescription>
                      Configure how inspector compensation is calculated
                    </CardDescription>
                  </div>
                  <Button>
                    <Settings className="mr-2 h-4 w-4" />
                    Add Rule
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isRulesError ? (
                  <div className="text-red-500">Failed to load pay rules.</div>
                ) : isRulesLoading ? (
                  <div className="text-sm text-muted-foreground">Loading pay rules...</div>
                ) : payRules.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No pay rules configured yet.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rule Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Applies To</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payRules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{rule.name}</span>
                              {rule.is_default && (
                                <Badge variant="secondary">Default</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">
                            {rule.rule_type.replace("_", " ")}
                          </TableCell>
                          <TableCell>{formatPayRuleValue(rule)}</TableCell>
                          <TableCell className="capitalize">{rule.applies_to}</TableCell>
                          <TableCell>
                            <Badge variant={rule.is_active ? "default" : "secondary"}>
                              {rule.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}
