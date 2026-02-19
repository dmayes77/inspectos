"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  UserPlus,
  Search,
  Download,
  Filter,
  Mail,
  Phone,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
} from "lucide-react";
import { ModernDataTable } from "@/components/ui/modern-data-table";
import { useClients, type Client } from "@/hooks/use-clients";
import { useLeads, type Lead } from "@/hooks/use-leads";
import { mockAdminUser } from "@inspectos/shared/constants/mock-users";
import { can } from "@/lib/admin/permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTACT_TYPE_FILTER_OPTIONS } from "@inspectos/shared/constants/contact-options";
import { contactsTableColumns } from "@/components/contacts/contacts-table-columns";
import { AdminPageSkeleton } from "@/layout/admin-page-skeleton";

function ClientsPageContent() {
  const { data: clientList = [] as Client[], isLoading } = useClients();
  const { data: leads = [] as Lead[], isLoading: leadsLoading } = useLeads();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const userRole = mockAdminUser.role;
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab = useMemo(() => {
    const tab = searchParams.get("tab");
    return tab === "leads" ? "leads" : "clients";
  }, [searchParams]);

  // Filter out agents from clients
  const contactClients = useMemo(
    () => clientList.filter((client: Client) => client.type !== "Real Estate Agent"),
    [clientList]
  );

  // Calculate stats
  const [ninetyDaysAgo] = useState(() => Date.now() - 90 * 24 * 60 * 60 * 1000);
  const stats = useMemo(() => {
    const totalClients = contactClients.length;
    const totalInspections = contactClients.reduce((acc: number, c: Client) => acc + (c.inspections || 0), 0);
    const totalRevenue = contactClients.reduce((acc: number, c: Client) => acc + (c.totalSpent || 0), 0);
    const activeClients = contactClients.filter(
      (c: Client) => c.lastInspection && new Date(c.lastInspection).getTime() > ninetyDaysAgo
    ).length;

    return {
      totalClients,
      totalInspections,
      totalRevenue,
      activeClients,
      avgRevenuePerClient: totalClients > 0 ? Math.round(totalRevenue / totalClients) : 0,
    };
  }, [contactClients, ninetyDaysAgo]);

  // Filter and sort clients
  const filteredClients = useMemo(() => {
    let filtered = contactClients;

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((client: Client) => client.type === typeFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (client: Client) =>
          client.name.toLowerCase().includes(query) ||
          client.email.toLowerCase().includes(query) ||
          (client.phone && client.phone.toLowerCase().includes(query))
      );
    }

    // Sort
    if (sortBy === "name") {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "recent") {
      filtered = [...filtered].sort((a, b) => {
        const dateA = a.lastInspection ? new Date(a.lastInspection).getTime() : 0;
        const dateB = b.lastInspection ? new Date(b.lastInspection).getTime() : 0;
        return dateB - dateA;
      });
    } else if (sortBy === "revenue") {
      filtered = [...filtered].sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
    }

    return filtered;
  }, [contactClients, typeFilter, searchQuery, sortBy]);

  // Show loading skeleton while data is being fetched
  if (isLoading || leadsLoading) {
    return <AdminPageSkeleton showTable listItems={10} />;
  }

  const formatStage = (stage: string) =>
    stage.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());

  const typeOptions = CONTACT_TYPE_FILTER_OPTIONS.filter(
    (option) => option.value !== "Real Estate Agent"
  );

  const handleExport = () => {
    // TODO: Implement CSV export
    console.log("Exporting", filteredClients.length, "clients");
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Contacts"
        description="Manage your client relationships and track interactions"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="border-brand-300 text-brand-700 hover:bg-brand-50 hover:text-brand-800 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-900/20"
              onClick={handleExport}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              className="border-brand-300 text-brand-700 hover:bg-brand-50 hover:text-brand-800 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-900/20"
              asChild
            >
              <Link href="/admin/contacts/leads/new">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Lead
              </Link>
            </Button>
            {can(userRole, "create_clients") && (
              <Button asChild>
                <Link href="/admin/contacts/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Client
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={(value: string) => router.replace(`/admin/contacts?tab=${value}`)}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 bg-brand-50 dark:bg-brand-950/40 md:w-80">
          <TabsTrigger
            value="clients"
            className="gap-2 text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200 data-[state=active]:bg-brand-500 data-[state=active]:text-white"
          >
            <Users className="h-4 w-4" />
            Clients
          </TabsTrigger>
          <TabsTrigger
            value="leads"
            className="gap-2 text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200 data-[state=active]:bg-brand-500 data-[state=active]:text-white"
          >
            <TrendingUp className="h-4 w-4" />
            Leads
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalClients}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeClients} active (90 days)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Inspections</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalInspections}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalClients > 0
                    ? (stats.totalInspections / stats.totalClients).toFixed(1)
                    : 0}{" "}
                  per client
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats.totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  ${stats.avgRevenuePerClient.toLocaleString()} avg per client
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Growth</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+12%</div>
                <p className="text-xs text-muted-foreground">vs last month</p>
              </CardContent>
            </Card>
          </div>

          {/* Clients Table */}
          <ModernDataTable
            columns={contactsTableColumns}
            data={filteredClients}
            title="All Clients"
            description={`${filteredClients.length} of ${contactClients.length} clients`}
            filterControls={
              <>
                <div className="relative flex-1 min-w-[200px] md:flex-initial md:w-[300px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search clients..."
                    className="!pl-9"
                  />
                </div>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recent</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                  </SelectContent>
                </Select>
              </>
            }
            emptyState={
              filteredClients.length === 0 && !searchQuery && typeFilter === "all" ? (
                <div className="rounded-lg border border-dashed p-12 text-center">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No clients yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add your first client to start scheduling inspections.
                  </p>
                  {can(userRole, "create_clients") && (
                    <Button asChild className="mt-6">
                      <Link href="/admin/contacts/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add client
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-12 text-center">
                  <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No results found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try adjusting your search or filters
                  </p>
                </div>
              )
            }
          />
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Pipeline</CardTitle>
              <CardDescription>Track inquiries and conversions</CardDescription>
            </CardHeader>
            <CardContent>
              {leadsLoading ? (
                <div className="rounded-lg border border-dashed p-12 text-center">
                  <p className="text-sm text-muted-foreground">Loading leads...</p>
                </div>
              ) : leads.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center">
                  <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No leads yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Capture inquiries from your website or add them manually.
                  </p>
                  <Button asChild className="mt-6">
                    <Link href="/admin/contacts/leads/new">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add lead
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {leads.map((lead: Lead) => (
                    <Link
                      key={lead.leadId}
                      href={`/admin/contacts/leads/${lead.leadId}?return=/admin/contacts?tab=leads`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-sm font-semibold text-primary">
                            {lead.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{lead.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {lead.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {lead.email}
                              </span>
                            )}
                            {lead.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {lead.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge color="light">{formatStage(lead.stage)}</Badge>
                        {lead.serviceName && (
                          <Badge color="light">{lead.serviceName}</Badge>
                        )}
                        {lead.estimatedValue && (
                          <span className="text-sm font-semibold text-muted-foreground">
                            ${lead.estimatedValue}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ClientsPage() {
  return (
    <>
    <Suspense fallback={<AdminPageSkeleton showTable listItems={10} />}>
      <ClientsPageContent />
    </Suspense>
    </>
  );
}
