"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ModernDataTable } from "@/components/ui/modern-data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Calendar, DollarSign, Mail, Phone, Plus, Search, TrendingUp, UserPlus, Users } from "lucide-react";
import { useLeads, type Lead } from "@/hooks/use-leads";
import { AdminPageSkeleton } from "@/layout/admin-page-skeleton";

type LeadRow = { original: Lead };

const formatStage = (stage: string) =>
  stage.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());

const stageBadgeClasses = (stage: string) => {
  switch (stage) {
    case "new":
      return "bg-brand-100 text-brand-700 border-brand-200";
    case "contacted":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "qualified":
      return "bg-green-100 text-green-800 border-green-200";
    case "proposal_sent":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "won":
      return "bg-green-500 text-white border-green-500";
    case "lost":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "";
  }
};

const columns: ColumnDef<Lead>[] = [
  {
    accessorKey: "name",
    header: "Lead",
    enableSorting: true,
    enableHiding: false,
    cell: ({ row }: { row: LeadRow }) => {
      const lead = row.original;
      return (
        <div className="flex flex-col gap-0.5 py-1">
          <Link href={`/leads/${lead.leadId}`} className="font-medium hover:underline">
            {lead.name}
          </Link>
          {lead.email && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
              <span>{lead.phone}</span>
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "serviceName",
    header: "Service",
    cell: ({ row }: { row: LeadRow }) => <span className="text-sm">{row.original.serviceName || "—"}</span>,
  },
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }: { row: LeadRow }) => <span className="text-sm text-muted-foreground">{row.original.source || "—"}</span>,
  },
  {
    accessorKey: "requestedDate",
    header: "Requested",
    cell: ({ row }: { row: LeadRow }) =>
      row.original.requestedDate ? (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {row.original.requestedDate}
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "estimatedValue",
    header: "Value",
    cell: ({ row }: { row: LeadRow }) => (
      <div className="flex items-center gap-1 text-sm font-medium">
        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
        {(row.original.estimatedValue ?? 0).toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: "stage",
    header: "Stage",
    cell: ({ row }: { row: LeadRow }) => (
      <Badge color="light" className={stageBadgeClasses(row.original.stage)}>
        {formatStage(row.original.stage)}
      </Badge>
    ),
  },
];

export default function LeadsPage() {
  const { data: leads = [] as Lead[], isLoading } = useLeads();
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");

  const stageOptions = useMemo(() => {
    const values = Array.from(new Set(leads.map((lead) => lead.stage).filter(Boolean)));
    return ["all", ...values];
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesStage = stageFilter === "all" || lead.stage === stageFilter;
      if (!matchesStage) return false;

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        lead.name.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.phone?.toLowerCase().includes(query) ||
        lead.serviceName?.toLowerCase().includes(query) ||
        lead.source?.toLowerCase().includes(query)
      );
    });
  }, [leads, searchQuery, stageFilter]);

  const stats = useMemo(() => {
    const total = leads.length;
    const newCount = leads.filter((lead) => lead.stage === "new").length;
    const qualified = leads.filter((lead) => lead.stage === "qualified").length;
    const won = leads.filter((lead) => lead.stage === "won").length;
    const totalValue = leads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0);

    return { total, newCount, qualified, won, totalValue };
  }, [leads]);

  if (isLoading) {
    return <AdminPageSkeleton showTable listItems={10} />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Leads"
        description="Track inquiries and convert them into active property work"
        actions={
          <Button asChild>
            <Link href="/leads/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Lead
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.qualified}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Won</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.won}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <ModernDataTable
        columns={columns}
        data={filteredLeads}
        title="All Leads"
        description={`${filteredLeads.length} of ${leads.length} leads`}
        filterControls={
          <>
            <div className="flex flex-wrap items-center gap-2">
              {stageOptions.map((stage) => (
                <Button
                  key={stage}
                  variant={stageFilter === stage ? "primary" : "outline"}
                  size="sm"
                  className={
                    stageFilter === stage
                      ? undefined
                      : "border-brand-300 text-brand-700 hover:bg-brand-50 hover:text-brand-800 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-900/20"
                  }
                  onClick={() => setStageFilter(stage)}
                >
                  {stage === "all" ? "All" : formatStage(stage)}
                </Button>
              ))}
            </div>
            <div className="relative min-w-[220px] flex-1 md:w-[320px] md:flex-initial">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search leads..."
                className="!pl-9"
              />
            </div>
          </>
        }
      />
    </div>
  );
}
