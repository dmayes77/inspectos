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
import { Building2, DollarSign, Mail, Phone, Plus, Search } from "lucide-react";
import { useAgents, type Agent } from "@/hooks/use-agents";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminPageSkeleton } from "@/layout/admin-page-skeleton";
import { toSlugIdSegment } from "@/lib/routing/slug-id";

type AgentRow = { original: Agent };

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
          <div className="min-w-0 flex flex-col gap-0.5">
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
        <Link href={`/agencies/${toSlugIdSegment(row.original.agency.name, row.original.agency.id)}`} className="flex items-center gap-2 text-sm hover:underline">
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

export default function AgentsPage() {
  const { data: agents = [], isLoading } = useAgents();
  const [agentQuery, setAgentQuery] = useState("");
  const [agentStatusFilter, setAgentStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const filteredAgents = useMemo(() => {
    const query = agentQuery.toLowerCase();
    return agents.filter((agent) => {
      const matchesStatus = agentStatusFilter === "all" || agent.status === agentStatusFilter;
      if (!matchesStatus) return false;
      if (!agentQuery.trim()) return true;
      return agent.name.toLowerCase().includes(query) || agent.email?.toLowerCase().includes(query) || agent.phone?.includes(query);
    });
  }, [agents, agentQuery, agentStatusFilter]);

  const agentStats = useMemo(() => {
    const active = agents.filter((agent) => agent.status === "active").length;
    const inactive = agents.filter((agent) => agent.status === "inactive").length;
    const totalReferrals = agents.reduce((sum, agent) => sum + agent.total_referrals, 0);
    const totalRevenue = agents.reduce((sum, agent) => sum + agent.total_revenue, 0);
    return { active, inactive, totalReferrals, totalRevenue };
  }, [agents]);

  if (isLoading) {
    return <AdminPageSkeleton showStats showTable listItems={10} />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Agents"
        description="Manage individual agents and their referral performance"
        actions={
          <Button asChild>
            <Link href="/agents/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Agent
            </Link>
          </Button>
        }
      />

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
                  className={
                    agentStatusFilter === status
                      ? undefined
                      : "border-brand-300 text-brand-700 hover:bg-brand-50 hover:text-brand-800 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-900/20"
                  }
                  onClick={() => setAgentStatusFilter(status as typeof agentStatusFilter)}
                >
                  {status === "all" ? "All" : `${status.charAt(0).toUpperCase()}${status.slice(1)}`}
                </Button>
              ))}
            </div>
            <div className="relative min-w-50 flex-1 md:w-75 md:flex-initial">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={agentQuery} onChange={(event) => setAgentQuery(event.target.value)} placeholder="Search agents..." className="pl-9!" />
            </div>
          </>
        }
      />
    </div>
  );
}
