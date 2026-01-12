"use client";

import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Clock, User } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { useInspections, type Inspection } from "@/hooks/use-inspections";

const mockUser = {
  name: "Sarah Johnson",
  email: "sarah@acmeinspections.com",
  companyName: "Acme Home Inspections",
};

// Data is loaded from `useInspections` hook so the UI can be built while the API/auth are implemented.
// Keep mock data in the hook as a fallback when the API is not available.

function getStatusBadge(status: string) {
  switch (status) {
    case "scheduled":
      return <Badge variant="secondary">Scheduled</Badge>;
    case "in_progress":
      return <Badge className="bg-amber-500 hover:bg-amber-500">In Progress</Badge>;
    case "completed":
      return <Badge className="bg-green-500 hover:bg-green-500">Completed</Badge>;
    case "pending_report":
      return <Badge className="bg-blue-500 hover:bg-blue-500">Pending Report</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

const columns: ColumnDef<Inspection>[] = [
  {
    accessorKey: "inspectionId",
    header: "ID",
    enableSorting: true,
    enableHiding: false,
    cell: ({ row }) => (
      <div className="text-sm font-medium whitespace-nowrap">
        <Link href={`/admin/inspections/${row.original.inspectionId}`} className="text-primary hover:underline">
          {row.original.inspectionId}
        </Link>
      </div>
    ),
  },
  {
    accessorKey: "address",
    header: "Property",
    enableSorting: false,
    cell: ({ row }) => {
      const parts = row.original.address.split(", ");
      return (
        <div className="flex items-start gap-2 max-w-xs">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm">
            <div>{parts[0]}</div>
            <div className="text-muted-foreground">{parts[1]}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "client",
    header: "Client",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex items-start gap-2 max-w-xs">
        <User className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <span className="text-sm">{row.original.client}</span>
      </div>
    ),
  },
  {
    accessorKey: "inspector",
    header: "Inspector",
    enableSorting: true,
    cell: ({ row }) => <div className="text-sm max-w-xs">{row.original.inspector}</div>,
  },
  {
    accessorKey: "date",
    header: "Date",
    enableSorting: true,
    cell: ({ row }) => (
      <div className="flex items-start gap-2">
        <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-sm">
          <div>{row.original.date}</div>
          <div className="text-muted-foreground">{row.original.time}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "types",
    header: "Type",
    enableSorting: false,
    cell: ({ row }) => {
      const types = row.original.types;
      return <Badge variant="outline">{types && types.length > 0 ? types[0] : ""}</Badge>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: true,
    cell: ({ row }) => getStatusBadge(row.original.status),
  },
  {
    accessorKey: "price",
    header: "Price",
    enableSorting: true,
    cell: ({ row }) => <div className="text-sm font-medium">${row.original.price}</div>,
  },
];

export default function InspectionsPage() {
  const { data, isLoading, isError } = useInspections();

  return (
    <AdminShell user={mockUser}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Inspections</h1>
            <p className="text-muted-foreground">Manage and track all inspections</p>
          </div>
          <Button asChild>
            <Link href="/admin/inspections/new">
              <Plus className="mr-2 h-4 w-4" />
              New Inspection
            </Link>
          </Button>
        </div>

        {/* Inspections Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Inspections</CardTitle>
            <CardDescription>{isLoading ? "Loading..." : `${data?.length ?? 0} total inspections`}</CardDescription>
          </CardHeader>
          <CardContent>
            {isError ? (
              <div className="text-red-500">Failed to load inspections.</div>
            ) : (
              <DataTable columns={columns} data={data ?? []} searchKey="address" searchPlaceholder="Search by property address..." />
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
