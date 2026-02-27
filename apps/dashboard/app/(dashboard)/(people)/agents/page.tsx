"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColumnDef } from "@tanstack/react-table";
import { ModernDataTable } from "@/components/ui/modern-data-table";
import { Building2, DollarSign, Mail, Phone, Plus, Search, Users } from "lucide-react";
import { useAgencies, type Agency } from "@/hooks/use-agencies";
import { useAgents, type Agent } from "@/hooks/use-agents";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CompanyLogo } from "@/components/shared/company-logo";
import { AdminPageSkeleton } from "@/layout/admin-page-skeleton";
import { toSlugIdSegment } from "@/lib/routing/slug-id";

type AgencyRow = { original: Agency };
type AgentRow = { original: Agent };

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
            <Link href={`/agents/agencies/${toSlugIdSegment(agency.name, agency.id)}`} className="font-medium hover:underline">
              {agency.name}
            </Link>
            {getAgencyDomain(agency) && (
              <p className="text-xs text-muted-foreground">{getAgencyDomain(agency)}</p>
            )}
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

const agentColumns: ColumnDef<Agent>[] = [
  {
    accessorKey: "name",
    header: "Agent",
    enableSorting: true,
    enableHiding: false,
    cell: ({ row }: { row: AgentRow }) => {
      const agent = row.original;
      return (
        <div className="flex items-start gap-3 py-1">
          <Avatar className="h-12 w-12 shrink-0">
            {agent.avatar_url ? (
              <AvatarImage src={agent.avatar_url} alt={agent.name} />
            ) : (
              <AvatarFallback>{agent.name.charAt(0)}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col gap-0.5 min-w-0">
            <Link href={`/agents/${toSlugIdSegment(agent.name, agent.public_id ?? agent.id)}`} className="font-medium hover:underline">
              {agent.name}
            </Link>
            {agent.email && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{agent.email}</span>
              </div>
            )}
            {agent.phone && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3 shrink-0" />
                <span>{agent.phone}</span>
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: "agency",
    header: "Agency",
    cell: ({ row }: { row: AgentRow }) =>
      row.original.agency ? (
        <Link href={`/agents/agencies/${toSlugIdSegment(row.original.agency.name, row.original.agency.id)}`} className="flex items-center gap-2 text-sm hover:underline">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          {row.original.agency.name}
        </Link>
      ) : (
        <span className="text-muted-foreground">Independent</span>
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
    cell: ({ row }: { row: AgentRow }) => <Badge color={row.original.status === "active" ? "primary" : "light"}>{row.original.status}</Badge>,
  },
];

function AgentsPageContent() {
  const { data: agencies = [], isLoading: agenciesLoading } = useAgencies();
  const { data: agents = [], isLoading: agentsLoading } = useAgents();
  const [agencyQuery, setAgencyQuery] = useState("");
  const [agentQuery, setAgentQuery] = useState("");
  const [agentStatusFilter, setAgentStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [agencyStatusFilter, setAgencyStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab = useMemo(() => {
    const tab = searchParams.get("tab");
    return tab === "agencies" ? "agencies" : "agents";
  }, [searchParams]);

  const filteredAgencies = useMemo(() => {
    const query = agencyQuery.toLowerCase();
    return agencies.filter((agency) => {
      const matchesStatus = agencyStatusFilter === "all" || agency.status === agencyStatusFilter;
      if (!matchesStatus) return false;
      if (!agencyQuery.trim()) return true;
      return agency.name.toLowerCase().includes(query) || agency.email?.toLowerCase().includes(query) || agency.city?.toLowerCase().includes(query);
    });
  }, [agencies, agencyQuery, agencyStatusFilter]);

  const filteredAgents = useMemo(() => {
    const query = agentQuery.toLowerCase();
    return agents.filter((agent) => {
      const matchesStatus = agentStatusFilter === "all" || agent.status === agentStatusFilter;
      if (!matchesStatus) return false;
      if (!agentQuery.trim()) return true;
      return agent.name.toLowerCase().includes(query) || agent.email?.toLowerCase().includes(query) || agent.phone?.includes(query);
    });
  }, [agents, agentQuery, agentStatusFilter]);

  const agencyStats = useMemo(() => {
    const active = agencies.filter((agency) => agency.status === "active").length;
    const inactive = agencies.filter((agency) => agency.status === "inactive").length;
    const totalAgents = agencies.reduce((sum, agency) => sum + (agency.agents?.length ?? 0), 0);
    const totalReferrals = agencies.reduce((sum, agency) => sum + agency.total_referrals, 0);
    const totalRevenue = agencies.reduce((sum, agency) => sum + agency.total_revenue, 0);
    return { active, inactive, totalAgents, totalReferrals, totalRevenue };
  }, [agencies]);

  const agentStats = useMemo(() => {
    const active = agents.filter((agent) => agent.status === "active").length;
    const inactive = agents.filter((agent) => agent.status === "inactive").length;
    const totalReferrals = agents.reduce((sum, agent) => sum + agent.total_referrals, 0);
    const totalRevenue = agents.reduce((sum, agent) => sum + agent.total_revenue, 0);
    return { active, inactive, totalReferrals, totalRevenue };
  }, [agents]);

  // Show loading skeleton while data is being fetched
  if (agenciesLoading || agentsLoading) {
    return <AdminPageSkeleton showStats showTable listItems={10} />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Agents"
        description="Track agencies and agents alongside their referral performance"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === "agencies" ? (
              <Button asChild>
                <Link href="/agents/agencies/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Agency
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/agents/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Agent
                </Link>
              </Button>
            )}
            {activeTab === "agencies" ? (
              <Button
                variant="outline"
                className="border-brand-300 text-brand-700 hover:bg-brand-50 hover:text-brand-800 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-900/20"
                asChild
              >
                <Link href="/agents/new">Add Agent</Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                className="border-brand-300 text-brand-700 hover:bg-brand-50 hover:text-brand-800 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-900/20"
                asChild
              >
                <Link href="/agents/agencies/new">Add Agency</Link>
              </Button>
            )}
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={(value: string) => router.replace(`/agents?tab=${value}`)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-brand-50 dark:bg-brand-950/40 md:w-70">
          <TabsTrigger className="text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200 data-[state=active]:bg-brand-500 data-[state=active]:text-white" value="agents">
            Agents
          </TabsTrigger>
          <TabsTrigger className="text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200 data-[state=active]:bg-brand-500 data-[state=active]:text-white" value="agencies">
            Agencies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatCard label="Total Agents" value={agents.length} />
            <StatCard label="Active Agents" value={agentStats.active} />
            <StatCard label="Inactive Agents" value={agentStats.inactive} />
            <StatCard label="Total Referrals" value={agentStats.totalReferrals} />
            <StatCard label="Total Revenue" value={`$${agentStats.totalRevenue.toLocaleString()}`} />
          </div>

          <ModernDataTable
            columns={agentColumns}
            data={filteredAgents}
            title="All Agents"
            description={`${filteredAgents.length} total agents`}
            filterControls={
              <>
                <div className="flex flex-wrap items-center gap-2">
                  {["all", "active", "inactive"].map((status) => (
                    <Button
                      key={status}
                      variant={agentStatusFilter === status ? "primary" : "outline"}
                      size="sm"
                      className={agentStatusFilter === status ? undefined : "border-brand-300 text-brand-700 hover:bg-brand-50 hover:text-brand-800 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-900/20"}
                      onClick={() => setAgentStatusFilter(status as typeof agentStatusFilter)}
                    >
                      {status === "all" ? "All" : `${status.charAt(0).toUpperCase()}${status.slice(1)}`}
                    </Button>
                  ))}
                </div>
                <div className="relative flex-1 min-w-50 md:flex-initial md:w-75">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={agentQuery} onChange={(event) => setAgentQuery(event.target.value)} placeholder="Search agents..." className="pl-9!" />
                </div>
              </>
            }
          />
        </TabsContent>

        <TabsContent value="agencies" className="space-y-6">
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
                      className={agencyStatusFilter === status ? undefined : "border-brand-300 text-brand-700 hover:bg-brand-50 hover:text-brand-800 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-900/20"}
                      onClick={() => setAgencyStatusFilter(status as typeof agencyStatusFilter)}
                    >
                      {status === "all" ? "All" : `${status.charAt(0).toUpperCase()}${status.slice(1)}`}
                    </Button>
                  ))}
                </div>
                <div className="relative flex-1 min-w-50 md:flex-initial md:w-75">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={agencyQuery} onChange={(event) => setAgencyQuery(event.target.value)} placeholder="Search agencies..." className="pl-9!" />
                </div>
              </>
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AgentsPage() {
  return (
    <>
    <Suspense fallback={null}>
      <AgentsPageContent />
    </Suspense>
    </>
  );
}
