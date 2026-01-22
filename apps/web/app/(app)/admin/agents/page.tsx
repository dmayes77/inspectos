"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, UserCheck, Search, Mail, Phone, Building2, DollarSign, Send } from "lucide-react";
import { useAgents, useSendAgentPortalLink, type Agent } from "@/hooks/use-agents";
import { useAgencies } from "@/hooks/use-agencies";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { toast } from "sonner";

const columns = (onSendPortalLink: (agentId: string) => void): ColumnDef<Agent>[] => [
  {
    accessorKey: "name",
    header: "Agent",
    cell: ({ row }) => (
      <Link
        href={`/admin/agents/${row.original.id}`}
        className="flex items-center gap-2 font-medium hover:underline"
      >
        <UserCheck className="h-4 w-4 text-muted-foreground" />
        {row.original.name}
      </Link>
    ),
  },
  {
    id: "agency",
    header: "Agency",
    cell: ({ row }) =>
      row.original.agency ? (
        <Link
          href={`/admin/agencies/${row.original.agency.id}`}
          className="flex items-center gap-2 text-sm hover:underline"
        >
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          {row.original.agency.name}
        </Link>
      ) : (
        <span className="text-muted-foreground">Independent</span>
      ),
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
    cell: ({ row }) => (
      <Badge variant={row.original.status === "active" ? "default" : "secondary"}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: "portal",
    header: "Portal",
    cell: ({ row }) => {
      const hasAccess = row.original.magic_link_token && row.original.magic_link_expires_at;
      const isExpired = hasAccess && new Date(row.original.magic_link_expires_at!) < new Date();
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            onSendPortalLink(row.original.id);
          }}
        >
          <Send className="mr-2 h-3.5 w-3.5" />
          {hasAccess && !isExpired ? "Resend" : "Send"} Link
        </Button>
      );
    },
  },
];

export default function AgentsPage() {
  const { data, isLoading, isError } = useAgents();
  const { data: agencies = [] } = useAgencies();
  const sendPortalLink = useSendAgentPortalLink();
  const agents = data ?? [];
  const [searchQuery, setSearchQuery] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("all");

  const handleSendPortalLink = (agentId: string) => {
    sendPortalLink.mutate(agentId, {
      onSuccess: () => {
        toast.success("Portal link sent successfully");
      },
      onError: () => {
        toast.error("Failed to send portal link");
      },
    });
  };

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesAgency =
        agencyFilter === "all" ||
        (agencyFilter === "independent" && !agent.agency_id) ||
        agent.agency_id === agencyFilter;
      if (!matchesAgency) return false;

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        agent.name.toLowerCase().includes(query) ||
        agent.email?.toLowerCase().includes(query) ||
        agent.phone?.includes(query)
      );
    });
  }, [agents, searchQuery, agencyFilter]);

  const stats = useMemo(() => {
    const active = agents.filter((a) => a.status === "active").length;
    const withPortalAccess = agents.filter(
      (a) => a.magic_link_token && a.magic_link_expires_at && new Date(a.magic_link_expires_at) > new Date()
    ).length;
    const totalReferrals = agents.reduce((sum, a) => sum + a.total_referrals, 0);
    const totalRevenue = agents.reduce((sum, a) => sum + a.total_revenue, 0);
    return { active, withPortalAccess, totalReferrals, totalRevenue };
  }, [agents]);

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Agents"
          description="Manage real estate agents and their portal access"
          actions={
            <Button asChild>
              <Link href="/admin/agents/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Agent
              </Link>
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Agents</CardDescription>
              <CardTitle className="text-2xl">{stats.active}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>With Portal Access</CardDescription>
              <CardTitle className="text-2xl">{stats.withPortalAccess}</CardTitle>
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
              <CardTitle className="text-2xl text-green-600">
                ${stats.totalRevenue.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search agents..."
                  className="pl-9"
                />
              </div>
              <Select value={agencyFilter} onValueChange={setAgencyFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by agency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agencies</SelectItem>
                  <SelectItem value="independent">Independent Agents</SelectItem>
                  {agencies.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id}>
                      {agency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery("");
                  setAgencyFilter("all");
                }}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Agents</CardTitle>
            <CardDescription>
              {isLoading ? "Loading..." : `${filteredAgents.length} agents`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isError ? (
              <div className="text-red-500">Failed to load agents.</div>
            ) : filteredAgents.length === 0 && !isLoading ? (
              <div className="rounded-lg border border-dashed p-10 text-center">
                <UserCheck className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No agents yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add your first agent to start tracking referrals.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/admin/agents/new">Add Agent</Link>
                </Button>
              </div>
            ) : (
              <DataTable
                columns={columns(handleSendPortalLink)}
                data={filteredAgents}
                searchKey="name"
                searchPlaceholder="Search by name..."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
