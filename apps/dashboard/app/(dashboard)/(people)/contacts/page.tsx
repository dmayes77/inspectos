"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  UserPlus,
  Search,
  Download,
  Filter,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
} from "lucide-react";
import { ModernDataTable } from "@/components/ui/modern-data-table";
import { useClients, type Client } from "@/hooks/use-clients";
import { useProfile } from "@/hooks/use-profile";
import { can } from "@/lib/admin/permissions";
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

function ContactsPageContent() {
  const { data: clientList = [] as Client[], isLoading } = useClients();
  const { data: profile } = useProfile();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const userRole = (profile?.role ?? "").toUpperCase();
  const userPermissions = profile?.permissions ?? [];

  const contactClients = useMemo(
    () => clientList.filter((client: Client) => client.type !== "Real Estate Agent"),
    [clientList]
  );

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

  const filteredClients = useMemo(() => {
    let filtered = contactClients;

    if (typeFilter !== "all") {
      filtered = filtered.filter((client: Client) => client.type === typeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (client: Client) =>
          client.name.toLowerCase().includes(query) ||
          client.email.toLowerCase().includes(query) ||
          (client.phone && client.phone.toLowerCase().includes(query))
      );
    }

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

  if (isLoading) {
    return <AdminPageSkeleton showTable listItems={10} />;
  }

  const typeOptions = CONTACT_TYPE_FILTER_OPTIONS.filter(
    (option) => option.value !== "Real Estate Agent"
  );

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
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              className="border-brand-300 text-brand-700 hover:bg-brand-50 hover:text-brand-800 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-900/20"
              asChild
            >
              <Link href="/leads">
                <UserPlus className="mr-2 h-4 w-4" />
                View Leads
              </Link>
            </Button>
            {can(userRole, "create_clients", userPermissions) && (
              <Button asChild>
                <Link href="/contacts/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Client
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">{stats.activeClients} active (90 days)</p>
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
              {stats.totalClients > 0 ? (stats.totalInspections / stats.totalClients).toFixed(1) : 0} per client
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">${stats.avgRevenuePerClient.toLocaleString()} avg per client</p>
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

      <ModernDataTable
        columns={contactsTableColumns}
        data={filteredClients}
        title="All Clients"
        description={`${filteredClients.length} of ${contactClients.length} clients`}
        filterControls={
          <>
            <div className="relative min-w-[200px] flex-1 md:w-[300px] md:flex-initial">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
            <div className="rounded-md border border-dashed p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No clients yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">Add your first client to start scheduling inspections.</p>
              {can(userRole, "create_clients", userPermissions) && (
                <Button asChild className="mt-6">
                  <Link href="/contacts/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add client
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-12 text-center">
              <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No results found</h3>
              <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )
        }
      />
    </div>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton showTable listItems={10} />}>
      <ContactsPageContent />
    </Suspense>
  );
}
