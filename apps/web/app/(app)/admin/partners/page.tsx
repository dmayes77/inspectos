"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import {
  Building2,
  DollarSign,
  Mail,
  Phone,
  Plus,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import { useAgencies, type Agency } from "@/hooks/use-agencies";
import { useAgents, type Agent } from "@/hooks/use-agents";
import { mockAdminUser } from "@/lib/constants/mock-users";

const tenantSlug = process.env.NEXT_PUBLIC_SUPABASE_TENANT_ID ?? "demo";

type AgencyRow = { original: Agency };
type AgentRow = { original: Agent };

function getAgencyLocation(agency: Agency) {
  return [agency.city, agency.state].filter(Boolean).join(", ");
}

const agencyColumns: ColumnDef<Agency>[] = [
  {
    accessorKey: "name",
    header: "Agency",
    cell: ({ row }: { row: AgencyRow }) => (
      <Link
        href={`/admin/agencies/${row.original.id}`}
        className="flex items-center gap-2 font-medium hover:underline"
      >
        <Building2 className="h-4 w-4 text-muted-foreground" />
        {row.original.name}
      </Link>
    ),
  },
  {
    id: "contact",
    header: "Contact",
    cell: ({ row }: { row: AgencyRow }) => (
      <div className="space-y-1 text-sm">
        {row.original.email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3 w-3" />
            {row.original.email}
          </div>
        )}
        {row.original.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3 w-3" />
            {row.original.phone}
          </div>
        )}
      </div>
    ),
  },
  {
    id: "location",
    header: "Location",
    cell: ({ row }: { row: AgencyRow }) => (
      <span className="text-sm text-muted-foreground">
        {getAgencyLocation(row.original) || "—"}
      </span>
    ),
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
    cell: ({ row }: { row: AgencyRow }) => (
      <Badge variant={row.original.status === "active" ? "default" : "secondary"}>
        {row.original.status}
      </Badge>
    ),
  },
];

const agentColumns: ColumnDef<Agent>[] = [
  {
    accessorKey: "name",
    header: "Agent",
    cell: ({ row }: { row: AgentRow }) => (
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
    cell: ({ row }: { row: AgentRow }) =>
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
    cell: ({ row }: { row: AgentRow }) => (
      <div className="space-y-1 text-sm">
        {row.original.email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3 w-3" />
            {row.original.email}
          </div>
        )}
        {row.original.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3 w-3" />
            {row.original.phone}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "total_referrals",
    header: "Referrals",
    cell: ({ row }: { row: AgentRow }) => <span className="font-medium">{row.original.total_referrals}</span>,
  },
  {
    accessorKey: "total_revenue",
    header: "Revenue",
    cell: ({ row }: { row: AgentRow }) => (
      <div className="flex items-center gap-1">
        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-medium">{row.original.total_revenue.toLocaleString()}</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: { row: AgentRow }) => (
      <Badge variant={row.original.status === "active" ? "default" : "secondary"}>
        {row.original.status}
      </Badge>
    ),
  },
];

function PartnersPageContent() {
  const { data: agencies = [] } = useAgencies(tenantSlug);
  const { data: agents = [] } = useAgents(tenantSlug);
  const [agencyQuery, setAgencyQuery] = useState("");
  const [agentQuery, setAgentQuery] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab = useMemo(() => {
    const tab = searchParams.get("tab");
    return tab === "agencies" ? "agencies" : "agents";
  }, [searchParams]);

  const filteredAgencies = useMemo(() => {
    if (!agencyQuery.trim()) return agencies;
    const query = agencyQuery.toLowerCase();
    return agencies.filter(
      (agency) =>
        agency.name.toLowerCase().includes(query) ||
        agency.email?.toLowerCase().includes(query) ||
        agency.city?.toLowerCase().includes(query)
    );
  }, [agencies, agencyQuery]);

  const filteredAgents = useMemo(() => {
    if (!agentQuery.trim()) return agents;
    const query = agentQuery.toLowerCase();
    return agents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(query) ||
        agent.email?.toLowerCase().includes(query) ||
        agent.phone?.includes(query)
    );
  }, [agents, agentQuery]);

  const agencyStats = useMemo(() => {
    const active = agencies.filter((agency) => agency.status === "active").length;
    const totalAgents = agencies.reduce((sum, agency) => sum + (agency.agents?.length ?? 0), 0);
    const totalReferrals = agencies.reduce((sum, agency) => sum + agency.total_referrals, 0);
    const totalRevenue = agencies.reduce((sum, agency) => sum + agency.total_revenue, 0);
    return { active, totalAgents, totalReferrals, totalRevenue };
  }, [agencies]);

  const agentStats = useMemo(() => {
    const active = agents.filter((agent) => agent.status === "active").length;
    const totalReferrals = agents.reduce((sum, agent) => sum + agent.total_referrals, 0);
    const totalRevenue = agents.reduce((sum, agent) => sum + agent.total_revenue, 0);
    return { active, totalReferrals, totalRevenue };
  }, [agents]);

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Partners"
          description="Track agencies and agents alongside their referral performance"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {activeTab === "agencies" ? (
                <Button asChild>
                  <Link href="/admin/agencies/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Agency
                  </Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/admin/agents/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Agent
                  </Link>
                </Button>
              )}
              {activeTab === "agencies" ? (
                <Button variant="outline" asChild>
                  <Link href="/admin/agents/new">Add Agent</Link>
                </Button>
              ) : (
                <Button variant="outline" asChild>
                  <Link href="/admin/agencies/new">Add Agency</Link>
                </Button>
              )}
            </div>
          }
        />

        <Tabs
          value={activeTab}
          onValueChange={(value: string) => router.replace(`/admin/partners?tab=${value}`)}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-2 md:w-70">
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="agencies">Agencies</TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-xl font-bold sm:text-2xl">{agents.length}</div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Total Agents</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-xl font-bold sm:text-2xl">{agentStats.active}</div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Active Agents</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-xl font-bold sm:text-2xl">{agentStats.totalReferrals}</div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Total Referrals</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-xl font-bold sm:text-2xl">
                    ${agentStats.totalRevenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Total Revenue</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Agents</CardTitle>
                <CardDescription>{filteredAgents.length} total agents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={agentQuery}
                    onChange={(event) => setAgentQuery(event.target.value)}
                    placeholder="Search agents..."
                    className="pl-9"
                  />
                </div>
                <DataTable
                  columns={agentColumns}
                  data={filteredAgents}
                  searchKey="name"
                  searchPlaceholder="Search agents..."
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agencies" className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-xl font-bold sm:text-2xl">{agencies.length}</div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Total Agencies</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-xl font-bold sm:text-2xl">{agencyStats.active}</div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Active Agencies</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-xl font-bold sm:text-2xl">{agencyStats.totalAgents}</div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Total Agents</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-xl font-bold sm:text-2xl">
                    ${agencyStats.totalRevenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Total Revenue</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Agencies</CardTitle>
                <CardDescription>{filteredAgencies.length} total agencies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={agencyQuery}
                    onChange={(event) => setAgencyQuery(event.target.value)}
                    placeholder="Search agencies..."
                    className="pl-9"
                  />
                </div>
                <DataTable
                  columns={agencyColumns}
                  data={filteredAgencies}
                  searchKey="name"
                  searchPlaceholder="Search agencies..."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}

export default function PartnersPage() {
  return (
    <Suspense fallback={null}>
      <PartnersPageContent />
    </Suspense>
  );
}
