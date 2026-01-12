"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Building,
  DollarSign,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react";

// Mock analytics data
const stats = {
  mrr: { value: 33710, change: 12.5, trend: "up" },
  arr: { value: 404520, change: 12.5, trend: "up" },
  customers: { value: 200, change: 8, trend: "up" },
  churn: { value: 2.1, change: -0.3, trend: "down" },
  arpu: { value: 168.55, change: 4.2, trend: "up" },
  ltv: { value: 8024, change: 15, trend: "up" },
};

const tierBreakdown = [
  { tier: "Pro", customers: 100, mrr: 7900, percentage: 50 },
  { tier: "Team", customers: 70, mrr: 15190, percentage: 35 },
  { tier: "Business", customers: 30, mrr: 10620, percentage: 15 },
];

const recentSignups = [
  { company: "Texas Home Inspectors", tier: "Team", date: "2 hours ago" },
  { company: "Mountain View Inspections", tier: "Pro", date: "5 hours ago" },
  { company: "Coastal Property Checks", tier: "Business", date: "1 day ago" },
  { company: "Metro Home Services", tier: "Pro", date: "1 day ago" },
  { company: "Summit Inspections LLC", tier: "Team", date: "2 days ago" },
];

const recentChurns = [
  { company: "Valley Home Check", tier: "Pro", reason: "Switched to competitor", date: "3 days ago" },
  { company: "Quick Inspect Co", tier: "Pro", reason: "Business closed", date: "1 week ago" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function StatCard({
  title,
  value,
  change,
  trend,
  format = "currency",
  prefix = "",
  suffix = "",
}: {
  title: string;
  value: number;
  change: number;
  trend: "up" | "down";
  format?: "currency" | "number" | "percent";
  prefix?: string;
  suffix?: string;
}) {
  const formattedValue =
    format === "currency"
      ? formatCurrency(value)
      : format === "percent"
      ? `${value}%`
      : value.toLocaleString();

  const isPositive = trend === "up" ? change > 0 : change < 0;

  return (
    <Card className="border-slate-800 bg-slate-900">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              isPositive ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(change)}%
          </div>
        </div>
        <p className="mt-2 text-3xl font-bold text-white">
          {prefix}
          {formattedValue}
          {suffix}
        </p>
      </CardContent>
    </Card>
  );
}

export default function PlatformAnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Platform Analytics</h1>
        <p className="text-slate-400">
          Overview of InspectOS SaaS metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="MRR"
          value={stats.mrr.value}
          change={stats.mrr.change}
          trend={stats.mrr.trend as "up" | "down"}
        />
        <StatCard
          title="ARR"
          value={stats.arr.value}
          change={stats.arr.change}
          trend={stats.arr.trend as "up" | "down"}
        />
        <StatCard
          title="Customers"
          value={stats.customers.value}
          change={stats.customers.change}
          trend={stats.customers.trend as "up" | "down"}
          format="number"
        />
        <StatCard
          title="Churn Rate"
          value={stats.churn.value}
          change={stats.churn.change}
          trend={stats.churn.trend as "up" | "down"}
          format="percent"
        />
        <StatCard
          title="ARPU"
          value={stats.arpu.value}
          change={stats.arpu.change}
          trend={stats.arpu.trend as "up" | "down"}
        />
        <StatCard
          title="LTV"
          value={stats.ltv.value}
          change={stats.ltv.change}
          trend={stats.ltv.trend as "up" | "down"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tier Breakdown */}
        <Card className="border-slate-800 bg-slate-900 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Revenue by Tier</CardTitle>
            <CardDescription className="text-slate-400">
              Customer distribution across pricing tiers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tierBreakdown.map((tier) => (
                <div key={tier.tier} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{tier.tier}</span>
                      <Badge
                        variant="secondary"
                        className="bg-slate-800 text-slate-300"
                      >
                        {tier.customers} companies
                      </Badge>
                    </div>
                    <span className="text-white">{formatCurrency(tier.mrr)}/mo</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(tier.mrr / stats.mrr.value) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4 border-t border-slate-800 pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">50%</p>
                <p className="text-xs text-slate-400">Pro tier</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">35%</p>
                <p className="text-xs text-slate-400">Team tier</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">15%</p>
                <p className="text-xs text-slate-400">Business tier</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="text-white">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-slate-800 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                  <Activity className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Active Trials</p>
                  <p className="text-xs text-slate-400">Currently trialing</p>
                </div>
              </div>
              <p className="text-xl font-bold text-white">24</p>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-800 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                  <CreditCard className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Trial → Paid</p>
                  <p className="text-xs text-slate-400">Conversion rate</p>
                </div>
              </div>
              <p className="text-xl font-bold text-white">68%</p>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-800 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Avg Seats</p>
                  <p className="text-xs text-slate-400">Per Team/Business</p>
                </div>
              </div>
              <p className="text-xl font-bold text-white">3.2</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Signups */}
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              Recent Signups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSignups.map((signup, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-slate-800 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-700 text-sm font-medium text-white">
                      {signup.company.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {signup.company}
                      </p>
                      <p className="text-xs text-slate-400">{signup.date}</p>
                    </div>
                  </div>
                  <Badge
                    className={
                      signup.tier === "Business"
                        ? "bg-primary"
                        : signup.tier === "Team"
                        ? "bg-blue-500"
                        : "bg-slate-600"
                    }
                  >
                    {signup.tier}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Churns */}
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingDown className="h-5 w-5 text-red-400" />
              Recent Churns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentChurns.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  No recent churns. Great job!
                </p>
              ) : (
                recentChurns.map((churn, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-slate-800 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/20 text-sm font-medium text-red-400">
                        {churn.company.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {churn.company}
                        </p>
                        <p className="text-xs text-slate-400">{churn.reason}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="border-slate-700 text-slate-400">
                        {churn.tier}
                      </Badge>
                      <p className="mt-1 text-xs text-slate-500">{churn.date}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
