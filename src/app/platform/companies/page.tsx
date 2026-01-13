"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Building,
  Users,
  CreditCard,
  Mail,
  ExternalLink,
  Ban,
} from "lucide-react";

// Mock companies data
const companies = [
  {
    id: "1",
    name: "Texas Home Inspectors",
    slug: "texas-home",
    email: "admin@texashome.com",
    tier: "TEAM",
    status: "ACTIVE",
    inspectors: 4,
    inspections: 156,
    mrr: 217,
    createdAt: "2025-08-15",
    trialEndsAt: null,
  },
  {
    id: "2",
    name: "Mountain View Inspections",
    slug: "mountain-view",
    email: "info@mvins.com",
    tier: "PRO",
    status: "TRIALING",
    inspectors: 1,
    inspections: 12,
    mrr: 0,
    createdAt: "2026-01-08",
    trialEndsAt: "2026-02-07",
  },
  {
    id: "3",
    name: "Coastal Property Checks",
    slug: "coastal-property",
    email: "contact@coastalproperty.com",
    tier: "BUSINESS",
    status: "ACTIVE",
    inspectors: 12,
    inspections: 892,
    mrr: 354,
    createdAt: "2025-06-01",
    trialEndsAt: null,
  },
  {
    id: "4",
    name: "Metro Home Services",
    slug: "metro-home",
    email: "admin@metrohome.com",
    tier: "PRO",
    status: "ACTIVE",
    inspectors: 1,
    inspections: 67,
    mrr: 79,
    createdAt: "2025-10-22",
    trialEndsAt: null,
  },
  {
    id: "5",
    name: "Summit Inspections LLC",
    slug: "summit-inspections",
    email: "hello@summit.com",
    tier: "TEAM",
    status: "PAST_DUE",
    inspectors: 3,
    inspections: 234,
    mrr: 159,
    createdAt: "2025-07-10",
    trialEndsAt: null,
  },
  {
    id: "6",
    name: "Valley Home Check",
    slug: "valley-home",
    email: "info@valleyhome.com",
    tier: "PRO",
    status: "CANCELED",
    inspectors: 1,
    inspections: 45,
    mrr: 0,
    createdAt: "2025-09-01",
    trialEndsAt: null,
  },
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: "bg-emerald-500/20 text-emerald-400",
    TRIALING: "bg-blue-500/20 text-blue-400",
    PAST_DUE: "bg-amber-500/20 text-amber-400",
    CANCELED: "bg-red-500/20 text-red-400",
  };
  return (
    <Badge className={styles[status] || "bg-slate-500/20 text-slate-400"}>
      {status.replace("_", " ")}
    </Badge>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    PRO: "bg-slate-600",
    TEAM: "bg-blue-600",
    BUSINESS: "bg-primary",
  };
  return <Badge className={styles[tier]}>{tier}</Badge>;
}

export default function PlatformCompaniesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: companies.length,
    active: companies.filter((c) => c.status === "ACTIVE").length,
    trialing: companies.filter((c) => c.status === "TRIALING").length,
    pastDue: companies.filter((c) => c.status === "PAST_DUE").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Companies</h1>
        <p className="text-slate-400">Manage customer accounts</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Total</p>
              <Building className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-1 text-2xl font-bold text-white">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Active</p>
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <p className="mt-1 text-2xl font-bold text-white">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Trialing</p>
              <div className="h-2 w-2 rounded-full bg-blue-400" />
            </div>
            <p className="mt-1 text-2xl font-bold text-white">{stats.trialing}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Past Due</p>
              <div className="h-2 w-2 rounded-full bg-amber-400" />
            </div>
            <p className="mt-1 text-2xl font-bold text-white">{stats.pastDue}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search companies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-slate-700 bg-slate-800 pl-9 text-white placeholder:text-slate-400"
        />
      </div>

      {/* Companies Table */}
      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 text-left text-sm text-slate-400">
                  <th className="p-4 font-medium">Company</th>
                  <th className="p-4 font-medium">Tier</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Inspectors</th>
                  <th className="p-4 font-medium">Inspections</th>
                  <th className="p-4 font-medium">MRR</th>
                  <th className="p-4 font-medium">Created</th>
                  <th className="p-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company) => (
                  <tr
                    key={company.id}
                    className="border-b border-slate-800 hover:bg-slate-800/50"
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-white">{company.name}</p>
                        <p className="text-sm text-slate-400">{company.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <TierBadge tier={company.tier} />
                    </td>
                    <td className="p-4">
                      <StatusBadge status={company.status} />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-white">
                        <Users className="h-4 w-4 text-slate-400" />
                        {company.inspectors}
                      </div>
                    </td>
                    <td className="p-4 text-white">{company.inspections}</td>
                    <td className="p-4 text-white">
                      {company.mrr > 0 ? `$${company.mrr}` : "-"}
                    </td>
                    <td className="p-4 text-slate-400">
                      {new Date(company.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Dashboard
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" />
                            Contact
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Billing
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-400">
                            <Ban className="mr-2 h-4 w-4" />
                            Suspend
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
