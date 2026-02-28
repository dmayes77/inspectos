"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import { ModernDataTable } from "@/components/ui/modern-data-table";
import { DollarSign, Mail, Phone, Plus, Search, Users } from "lucide-react";
import { useAgencies, type Agency } from "@/hooks/use-agencies";
import { CompanyLogo } from "@/components/shared/company-logo";
import { AdminPageSkeleton } from "@/layout/admin-page-skeleton";
import { toSlugIdSegment } from "@/lib/routing/slug-id";

type AgencyRow = { original: Agency };

function getAgencyLocation(agency: Agency) {
  return [agency.city, agency.state].filter(Boolean).join(", ");
}

function getAgencyDomain(agency: Agency) {
  const raw = agency.website?.trim();
  if (!raw) return null;
  return raw.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

const agencyColumns: ColumnDef<Agency>[] = [
  {
    accessorKey: "name",
    header: "Agency",
    enableSorting: true,
    enableHiding: false,
    cell: ({ row }: { row: AgencyRow }) => {
      const agency = row.original;
      return (
        <div className="flex items-center gap-3">
          <CompanyLogo name={agency.name} logoUrl={agency.logo_url} website={agency.website ?? undefined} size={40} className="h-10 w-10 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <Link href={`/agencies/${toSlugIdSegment(agency.name, agency.id)}`} className="font-medium hover:underline">
              {agency.name}
            </Link>
            {getAgencyDomain(agency) && <p className="text-xs text-muted-foreground">{getAgencyDomain(agency)}</p>}
            {agency.email && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{agency.email}</span>
              </div>
            )}
            {agency.phone && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3 shrink-0" />
                <span>{agency.phone}</span>
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: "location",
    header: "Location",
    cell: ({ row }: { row: AgencyRow }) => <span className="text-sm text-muted-foreground">{getAgencyLocation(row.original) || "—"}</span>,
  },
  {
    id: "agents",
    header: "Agents",
    cell: ({ row }: { row: AgencyRow }) => (
      <div className="flex items-center gap-2 text-sm">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span>{row.original.agents?.length ?? 0}</span>
      </div>
    ),
  },
  {
    accessorKey: "total_referrals",
    header: "Referrals",
    cell: ({ row }: { row: AgencyRow }) => <span className="font-medium">{row.original.total_referrals}</span>,
  },
  {
    accessorKey: "total_revenue",
    header: "Revenue",
    cell: ({ row }: { row: AgencyRow }) => (
      <div className="flex items-center gap-1">
        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-medium">{row.original.total_revenue.toLocaleString()}</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: { row: AgencyRow }) => <Badge color={row.original.status === "active" ? "primary" : "light"}>{row.original.status}</Badge>,
  },
];

export default function AgenciesPage() {
  const { data: agencies = [], isLoading } = useAgencies();
  const [agencyQuery, setAgencyQuery] = useState("");
  const [agencyStatusFilter, setAgencyStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const filteredAgencies = useMemo(() => {
    const query = agencyQuery.toLowerCase();
    return agencies.filter((agency) => {
      const matchesStatus = agencyStatusFilter === "all" || agency.status === agencyStatusFilter;
      if (!matchesStatus) return false;
      if (!agencyQuery.trim()) return true;
      return agency.name.toLowerCase().includes(query) || agency.email?.toLowerCase().includes(query) || agency.city?.toLowerCase().includes(query);
    });
  }, [agencies, agencyQuery, agencyStatusFilter]);

  const agencyStats = useMemo(() => {
    const active = agencies.filter((agency) => agency.status === "active").length;
    const inactive = agencies.filter((agency) => agency.status === "inactive").length;
    const totalAgents = agencies.reduce((sum, agency) => sum + (agency.agents?.length ?? 0), 0);
    const totalRevenue = agencies.reduce((sum, agency) => sum + agency.total_revenue, 0);
    return { active, inactive, totalAgents, totalRevenue };
  }, [agencies]);

  if (isLoading) {
    return <AdminPageSkeleton showStats showTable listItems={10} />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Agencies"
        description="Manage brokerages and agency-level referral performance"
        actions={
          <Button asChild>
            <Link href="/agencies/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Agency
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total Agencies" value={agencies.length} />
        <StatCard label="Active Agencies" value={agencyStats.active} />
        <StatCard label="Inactive Agencies" value={agencyStats.inactive} />
        <StatCard label="Total Agents" value={agencyStats.totalAgents} />
        <StatCard label="Total Revenue" value={`$${agencyStats.totalRevenue.toLocaleString()}`} />
      </div>

      <ModernDataTable
        columns={agencyColumns}
        data={filteredAgencies}
        title="All Agencies"
        description={`${filteredAgencies.length} total agencies`}
        filterControls={
          <>
            <div className="flex flex-wrap items-center gap-2">
              {["all", "active", "inactive"].map((status) => (
                <Button
                  key={status}
                  variant={agencyStatusFilter === status ? "primary" : "outline"}
                  size="sm"
                  className={
                    agencyStatusFilter === status
                      ? undefined
                      : "border-brand-300 text-brand-700 hover:bg-brand-50 hover:text-brand-800 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-900/20"
                  }
                  onClick={() => setAgencyStatusFilter(status as typeof agencyStatusFilter)}
                >
                  {status === "all" ? "All" : `${status.charAt(0).toUpperCase()}${status.slice(1)}`}
                </Button>
              ))}
            </div>
            <div className="relative min-w-50 flex-1 md:w-75 md:flex-initial">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={agencyQuery} onChange={(event) => setAgencyQuery(event.target.value)} placeholder="Search agencies..." className="pl-9!" />
            </div>
          </>
        }
      />
    </div>
  );
}
