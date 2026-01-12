"use client";

import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Mail, Phone, ClipboardList } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { useClients, type Client } from "@/hooks/use-clients";

const mockUser = {
  name: "Sarah Johnson",
  email: "sarah@acmeinspections.com",
  companyName: "Acme Home Inspections",
};

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

  return (
    <AdminShell user={mockUser}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
            <p className="text-muted-foreground">Manage your client relationships</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{clientList.length}</div>
              <p className="text-sm text-muted-foreground">Total Clients</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{clientList.filter((c) => c.type === "Real Estate Agent").length}</div>
              <p className="text-sm text-muted-foreground">Real Estate Agents</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{clientList.reduce((acc, c) => acc + c.inspections, 0)}</div>
              <p className="text-sm text-muted-foreground">Total Inspections</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">${clientList.reduce((acc, c) => acc + c.totalSpent, 0).toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
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
              <DataTable columns={columns} data={clientList} searchKey="name" searchPlaceholder="Search by client name..." />
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
