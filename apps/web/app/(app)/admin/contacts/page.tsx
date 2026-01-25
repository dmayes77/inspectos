"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Mail, Phone, ClipboardList, Search, UserPlus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { useClients, type Client } from "@/hooks/use-clients";
import { useLeads, type Lead } from "@/hooks/use-leads";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { can } from "@/lib/admin/permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CONTACT_TYPE_FILTER_OPTIONS } from "@/lib/constants/contact-options";
import { contactsTableColumns, getContactTypeBadge } from "@/components/contacts/contacts-table-columns";

function ClientsPageContent() {
  const { data: clientList = [] as Client[], isLoading } = useClients();
  const { data: leads = [] as Lead[], isLoading: leadsLoading } = useLeads();
  const [mobileQuery, setMobileQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const userRole = mockAdminUser.role;
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = useMemo(() => {
    const tab = searchParams.get("tab");
    return tab === "leads" ? "leads" : "clients";
  }, [searchParams]);
  const formatStage = (stage: string) => stage.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());

  const contactClients = useMemo(
    () => clientList.filter((client: Client) => client.type !== "Real Estate Agent"),
    [clientList]
  );

  const filteredMobile = contactClients.filter((client: Client) => {
    const matchesType = typeFilter === "all" || client.type === typeFilter;
    if (!matchesType) return false;
    if (!mobileQuery.trim()) return true;
    const query = mobileQuery.toLowerCase();
    return client.name.toLowerCase().includes(query) || client.email.toLowerCase().includes(query);
  });

  const typeOptions = CONTACT_TYPE_FILTER_OPTIONS.filter((option) => option.value !== "Real Estate Agent");

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Contacts"
          description="Manage leads, clients, and conversions"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/admin/leads/new">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Lead
                </Link>
              </Button>
              {can(userRole, "create_clients") ? (
                <Button asChild className="sm:w-auto">
                  <Link href="/admin/contacts/clients/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Client
                  </Link>
                </Button>
              ) : null}
            </div>
          }
        />

        <Tabs value={activeTab} onValueChange={(value: string) => router.replace(`/admin/contacts?tab=${value}`)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:w-70">
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-xl font-bold sm:text-2xl">{contactClients.length}</div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Homebuyer & Homeowner contacts</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-xl font-bold sm:text-2xl">{contactClients.reduce((acc: number, c: Client) => acc + c.inspections, 0)}</div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Total Inspections</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-xl font-bold sm:text-2xl">${contactClients.reduce((acc: number, c: Client) => acc + c.totalSpent, 0).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Total Revenue</p>
                </CardContent>
              </Card>
            </div>

            {/* Clients Table */}
            <Card>
              <CardHeader>
                  <CardTitle>All Clients</CardTitle>
                  <CardDescription>{isLoading ? "Loading..." : `${contactClients.length} residential contacts`}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-12 text-center text-muted-foreground">Loading clients...</div>
                ) : (
                  <>
                    <div className="md:hidden space-y-4">
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={mobileQuery}
                            onChange={(event) => setMobileQuery(event.target.value)}
                            placeholder="Search clients..."
                            className="pl-9"
                          />
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                          {typeOptions.map((option) => (
                            <Button
                              key={option.value}
                              type="button"
                              variant={typeFilter === option.value ? "default" : "outline"}
                              size="sm"
                              onClick={() => setTypeFilter(option.value)}
                            >
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                      {filteredMobile.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">No clients found.</div>
                      ) : (
                        filteredMobile.map((client: Client) => (
                          <Link
                            key={client.clientId}
                            href={`/admin/contacts/clients/${client.clientId}`}
                            className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold">{client.name}</p>
                                <p className="text-xs text-muted-foreground">{client.email}</p>
                              </div>
                              <div className="shrink-0">{getContactTypeBadge(client.type)}</div>
                            </div>
                            <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5" />
                                <span className="truncate">{client.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5" />
                                <span>{client.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <ClipboardList className="h-3.5 w-3.5" />
                                <span>{client.inspections} inspections</span>
                              </div>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                    <div className="hidden md:block">
                      {contactClients.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-10 text-center">
                          <h3 className="text-lg font-semibold">No clients yet</h3>
                          <p className="mt-2 text-sm text-muted-foreground">Add your first client to start scheduling inspections.</p>
                              {can(userRole, "create_clients") && (
                                <Button asChild className="mt-4">
                                  <Link href="/admin/contacts/clients/new">Add client</Link>
                                </Button>
                              )}
                        </div>
                      ) : (
                        <DataTable columns={contactsTableColumns} data={contactClients} searchKey="name" searchPlaceholder="Search by client name..." />
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads">
            <Card>
              <CardHeader>
                <CardTitle>Lead Pipeline</CardTitle>
                <CardDescription>Track inquiry stages and conversions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {leadsLoading ? (
                  <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">Loading leads...</div>
                ) : leads.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                    No leads yet. Capture inquiries from the website or add them manually.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leads.map((lead: Lead) => (
                      <Link
                        key={lead.leadId}
                        href={`/admin/leads/${lead.leadId}?return=/admin/contacts?tab=leads`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 text-sm hover:border-primary/40"
                      >
                        <div>
                          <p className="font-medium">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">{lead.email || "No email"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{formatStage(lead.stage)}</Badge>
                          {lead.serviceName ? <Badge variant="secondary">{lead.serviceName}</Badge> : null}
                          {lead.estimatedValue ? <span className="text-xs font-semibold text-muted-foreground">${lead.estimatedValue}</span> : null}
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
    </AdminShell>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
      <ClientsPageContent />
    </Suspense>
  );
}
