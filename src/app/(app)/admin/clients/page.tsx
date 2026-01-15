"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Mail, Phone, ClipboardList, Search } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { useClients, type Client } from "@/hooks/use-clients";
import { mockAdminUser } from "@/lib/constants/mock-users";

function getTypeBadge(type: string) {
  switch (type) {
    case "Homebuyer":
      return <Badge variant="secondary">Homebuyer</Badge>;
    case "Real Estate Agent":
      return <Badge className="bg-blue-500 hover:bg-blue-500">Agent</Badge>;
    case "Seller":
      return <Badge variant="outline">Seller</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

const columns: ColumnDef<Client>[] = [
  {
    accessorKey: "name",
    header: "Name",
    enableSorting: true,
    enableHiding: false,
    cell: ({ row }) => (
      <Link href={`/admin/clients/${row.original.clientId}`} className="font-medium hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  // Add Edit/Delete/Archive actions column here if needed
  {
    id: "contact",
    header: "Contact",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-3 w-3" />
          {row.original.email}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-3 w-3" />
          {row.original.phone}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    enableSorting: true,
    cell: ({ row }) => getTypeBadge(row.original.type),
  },
  {
    accessorKey: "inspections",
    header: "Inspections",
    enableSorting: true,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-muted-foreground" />
        <span>{row.original.inspections}</span>
      </div>
    ),
  },
  {
    accessorKey: "lastInspection",
    header: "Last Inspection",
    enableSorting: true,
    cell: ({ row }) => <div className="text-sm text-muted-foreground">{row.original.lastInspection}</div>,
  },
  {
    accessorKey: "totalSpent",
    header: "Total Spent",
    enableSorting: true,
    cell: ({ row }) => <div className="font-medium">${row.original.totalSpent.toLocaleString()}</div>,
  },
];

export default function ClientsPage() {
  const { data: clientList = [], isLoading } = useClients();
  const [mobileQuery, setMobileQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredMobile = clientList.filter((client) => {
    const matchesType = typeFilter === "all" || client.type === typeFilter;
    if (!matchesType) return false;
    if (!mobileQuery.trim()) return true;
    const query = mobileQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query)
    );
  });

  const typeOptions = [
    { value: "all", label: "All" },
    { value: "Homebuyer", label: "Homebuyer" },
    { value: "Real Estate Agent", label: "Agent" },
    { value: "Seller", label: "Seller" },
  ];

  return (
    <AppShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Clients"
          description="Manage your client relationships"
          actions={
            <Button className="sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-xl font-bold sm:text-2xl">{clientList.length}</div>
              <p className="text-xs text-muted-foreground sm:text-sm">Total Clients</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xl font-bold sm:text-2xl">{clientList.filter((c) => c.type === "Real Estate Agent").length}</div>
              <p className="text-xs text-muted-foreground sm:text-sm">Real Estate Agents</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xl font-bold sm:text-2xl">{clientList.reduce((acc, c) => acc + c.inspections, 0)}</div>
              <p className="text-xs text-muted-foreground sm:text-sm">Total Inspections</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xl font-bold sm:text-2xl">${clientList.reduce((acc, c) => acc + c.totalSpent, 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground sm:text-sm">Total Revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Clients</CardTitle>
            <CardDescription>{isLoading ? "Loading..." : `${clientList.length} total clients`}</CardDescription>
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
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No clients found.
                    </div>
                  ) : (
                    filteredMobile.map((client) => (
                      <Link
                        key={client.clientId}
                        href={`/admin/clients/${client.clientId}`}
                        className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">{client.name}</p>
                            <p className="text-xs text-muted-foreground">{client.email}</p>
                          </div>
                          <div className="shrink-0">{getTypeBadge(client.type)}</div>
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
                  <DataTable columns={columns} data={clientList} searchKey="name" searchPlaceholder="Search by client name..." />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
