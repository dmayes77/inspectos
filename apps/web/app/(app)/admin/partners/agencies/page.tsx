"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Building2, Search, Mail, Phone, Users, DollarSign } from "lucide-react";
import { useAgencies, type Agency } from "@/hooks/use-agencies";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { AgencyLookupCard } from "@/components/partners/agency-lookup-card";
import { CompanyLogo } from "@/components/shared/company-logo";

const columns: ColumnDef<Agency>[] = [
  {
    accessorKey: "name",
    header: "Agency",
    cell: ({ row }) => {
      return (
        <Link href={`/admin/partners/agencies/${row.original.id}`} className="flex items-center gap-3 hover:underline">
          <CompanyLogo name={row.original.name} logoUrl={row.original.logo_url} website={row.original.website} size={40} className="h-10 w-10" />
          <div>
            <p className="font-medium">{row.original.name}</p>
            {row.original.website && <p className="text-xs text-muted-foreground">{row.original.website.replace(/^https?:\/\//, "")}</p>}
          </div>
        </Link>
      );
    },
  },
  {
    id: "contact",
    header: "Contact",
    cell: ({ row }) => (
      <div className="space-y-1">
        {row.original.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            {row.original.email}
          </div>
        )}
        {row.original.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            {row.original.phone}
          </div>
        )}
      </div>
    ),
  },
  {
    id: "location",
    header: "Location",
    cell: ({ row }) => {
      const { city, state } = row.original;
      if (!city && !state) return <span className="text-muted-foreground">—</span>;
      return <span className="text-sm">{[city, state].filter(Boolean).join(", ")}</span>;
    },
  },
  {
    id: "agents",
    header: "Agents",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span>{row.original.agents?.length ?? 0}</span>
      </div>
    ),
  },
  {
    accessorKey: "total_referrals",
    header: "Referrals",
    cell: ({ row }) => <span className="font-medium">{row.original.total_referrals}</span>,
  },
  {
    accessorKey: "total_revenue",
    header: "Revenue",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-medium">{row.original.total_revenue.toLocaleString()}</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge variant={row.original.status === "active" ? "default" : "secondary"}>{row.original.status}</Badge>,
  },
];

export default function AgenciesPage() {
  const { data, isLoading, isError } = useAgencies();
  const agencies = data ?? [];
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAgencies = useMemo(() => {
    if (!searchQuery.trim()) return agencies;
    const query = searchQuery.toLowerCase();
    return agencies.filter(
      (agency) => agency.name.toLowerCase().includes(query) || agency.email?.toLowerCase().includes(query) || agency.city?.toLowerCase().includes(query),
    );
  }, [agencies, searchQuery]);

  const stats = useMemo(() => {
    const active = agencies.filter((a) => a.status === "active").length;
    const totalAgents = agencies.reduce((sum, a) => sum + (a.agents?.length ?? 0), 0);
    const totalReferrals = agencies.reduce((sum, a) => sum + a.total_referrals, 0);
    const totalRevenue = agencies.reduce((sum, a) => sum + a.total_revenue, 0);
    return { active, totalAgents, totalReferrals, totalRevenue };
  }, [agencies]);

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Agencies"
          description="Manage real estate agencies and brokerages"
          actions={
            <Button asChild>
              <Link href="/admin/partners/agencies/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Agency
              </Link>
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Agencies</CardDescription>
              <CardTitle className="text-2xl">{stats.active}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Agents</CardDescription>
              <CardTitle className="text-2xl">{stats.totalAgents}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Referrals</CardDescription>
              <CardTitle className="text-2xl">{stats.totalReferrals}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className="text-2xl text-green-600">${stats.totalRevenue.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <AgencyLookupCard />

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search agencies..." className="pl-9" />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Agencies</CardTitle>
            <CardDescription>{isLoading ? "Loading..." : `${filteredAgencies.length} agencies`}</CardDescription>
          </CardHeader>
          <CardContent>
            {isError ? (
              <div className="text-red-500">Failed to load agencies.</div>
            ) : filteredAgencies.length === 0 && !isLoading ? (
              <div className="rounded-lg border border-dashed p-10 text-center">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No agencies yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">Add your first agency to start tracking referrals.</p>
                <Button asChild className="mt-4">
                  <Link href="/admin/partners/agencies/new">Add Agency</Link>
                </Button>
              </div>
            ) : (
              <DataTable columns={columns} data={filteredAgencies} searchKey="name" searchPlaceholder="Search by name..." />
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
