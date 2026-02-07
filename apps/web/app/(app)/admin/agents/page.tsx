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
import { Building2, DollarSign, Mail, Phone, Plus, Search, Users } from "lucide-react";
import { useAgencies, type Agency } from "@/hooks/use-agencies";
import { useAgents, type Agent } from "@/hooks/use-agents";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CompanyLogo } from "@/components/shared/company-logo";
import { AdminPageSkeleton } from "@/components/layout/admin-page-skeleton";

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
    cell: ({ row }: { row: AgencyRow }) => (
      <Link href={`/admin/agents/agencies/${row.original.id}`} className="flex items-center gap-3 hover:underline">
        <CompanyLogo name={row.original.name} logoUrl={row.original.logo_url} website={row.original.website ?? undefined} size={40} className="h-10 w-10" />
        <div className="text-sm">
          <p className="font-medium leading-tight">{row.original.name}</p>
          {getAgencyDomain(row.original) && <p className="text-xs text-muted-foreground">{getAgencyDomain(row.original)}</p>}
        </div>
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
    cell: ({ row }: { row: AgencyRow }) => <Badge variant={row.original.status === "active" ? "default" : "secondary"}>{row.original.status}</Badge>,
  },
];

const agentColumns: ColumnDef<Agent>[] = [
  {
    accessorKey: "name",
    header: "Agent",
    cell: ({ row }: { row: AgentRow }) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          {row.original.avatar_url ? (
            <AvatarImage src={row.original.avatar_url} alt={row.original.name} />
          ) : (
            <AvatarFallback>{row.original.name.charAt(0)}</AvatarFallback>
          )}
        </Avatar>
        <Link href={`/admin/agents/${row.original.id}`} className="font-medium hover:underline">
          {row.original.name}
        </Link>
      </div>
    ),
  },
  {
    id: "agency",
    header: "Agency",
    cell: ({ row }: { row: AgentRow }) =>
      row.original.agency ? (
        <Link href={`/admin/agents/agencies/${row.original.agency.id}`} className="flex items-center gap-2 text-sm hover:underline">
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
    cell: ({ row }: { row: AgentRow }) => <Badge variant={row.original.status === "active" ? "default" : "secondary"}>{row.original.status}</Badge>,
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
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Agents"
          description="Track agencies and agents alongside their referral performance"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {activeTab === "agencies" ? (
                <Button asChild>
                  <Link href="/admin/agents/agencies/new">
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
                  <Link href="/admin/agents/agencies/new">Add Agency</Link>
                </Button>
              )}
            </div>
          }
        />

        <Tabs value={activeTab} onValueChange={(value: string) => router.replace(`/admin/agents?tab=${value}`)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-accent md:w-70">
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="agencies">Agencies</TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
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
                  <div className="text-xl font-bold sm:text-2xl">{agentStats.inactive}</div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Inactive Agents</p>
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
                  <div className="text-xl font-bold sm:text-2xl">${agentStats.totalRevenue.toLocaleString()}</div>
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
                <div className="flex flex-wrap items-center gap-2 pb-4">
                  {["all", "active", "inactive"].map((status) => (
                    <Button
                      key={status}
                      variant={agentStatusFilter === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAgentStatusFilter(status as typeof agentStatusFilter)}
                    >
                      {status === "all" ? "All" : `${status.charAt(0).toUpperCase()}${status.slice(1)}`}
                    </Button>
                  ))}
                </div>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={agentQuery} onChange={(event) => setAgentQuery(event.target.value)} placeholder="Search agents..." className="pl-9" />
                </div>
                <div className="space-y-4 md:hidden">
                  {filteredAgents.map((agent) => (
                    <Link
                      key={agent.id}
                      href={`/admin/agents/${agent.id}`}
                      className="block rounded-lg border p-4 transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      aria-label={`View ${agent.name}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {agent.avatar_url ? (
                              <AvatarImage src={agent.avatar_url} alt={agent.name} />
                            ) : (
                              <AvatarFallback>{agent.name.charAt(0)}</AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium">{agent.name}</p>
                            <p className="text-xs text-muted-foreground">{agent.email ?? "—"}</p>
                          </div>
                        </div>
                        <Badge variant={agent.status === "active" ? "default" : "secondary"}>{agent.status}</Badge>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                        {agent.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{agent.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{agent.total_revenue.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{agent.total_referrals} referrals</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="hidden md:block">
                  <DataTable columns={agentColumns} data={filteredAgents} searchKey="name" searchPlaceholder="Search agents..." />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agencies" className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
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
                  <div className="text-xl font-bold sm:text-2xl">{agencyStats.inactive}</div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Inactive Agencies</p>
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
                  <div className="text-xl font-bold sm:text-2xl">${agencyStats.totalRevenue.toLocaleString()}</div>
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
                <div className="flex flex-wrap items-center gap-2 pb-4">
                  {["all", "active", "inactive"].map((status) => (
                    <Button
                      key={status}
                      variant={agencyStatusFilter === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAgencyStatusFilter(status as typeof agencyStatusFilter)}
                    >
                      {status === "all" ? "All" : `${status.charAt(0).toUpperCase()}${status.slice(1)}`}
                    </Button>
                  ))}
                </div>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={agencyQuery} onChange={(event) => setAgencyQuery(event.target.value)} placeholder="Search agencies..." className="pl-9" />
                </div>
                <div className="space-y-4 md:hidden">
                  {filteredAgencies.map((agency) => (
                    <div key={agency.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <CompanyLogo name={agency.name} logoUrl={agency.logo_url} website={agency.website ?? undefined} size={44} className="h-11 w-11" />
                          <div>
                            <p className="font-medium leading-tight">{agency.name}</p>
                            {getAgencyDomain(agency) && <p className="text-xs text-muted-foreground">{getAgencyDomain(agency)}</p>}
                            {getAgencyLocation(agency) && <p className="text-xs text-muted-foreground">{getAgencyLocation(agency)}</p>}
                            {!getAgencyDomain(agency) && !getAgencyLocation(agency) && <p className="text-xs text-muted-foreground">—</p>}
                          </div>
                        </div>
                        <Badge variant={agency.status === "active" ? "default" : "secondary"}>{agency.status}</Badge>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                        {agency.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5" />
                            <span>{agency.email}</span>
                          </div>
                        )}
                        {agency.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{agency.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{agency.agents?.length ?? 0} agents</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>${agency.total_revenue.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden md:block">
                  <DataTable columns={agencyColumns} data={filteredAgencies} searchKey="name" searchPlaceholder="Search agencies..." />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}

export default function AgentsPage() {
  return (
    <Suspense fallback={null}>
      <AgentsPageContent />
    </Suspense>
  );
}
