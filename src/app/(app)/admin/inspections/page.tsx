"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MapPin, Clock, User, Search } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { useInspections, type Inspection } from "@/hooks/use-inspections";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { parseAddress } from "@/lib/utils/address";

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
      const { street, city, state, zip } = parseAddress(row.original.address);
      return (
        <div className="flex items-start gap-2 max-w-xs">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm">
            <div>{street}</div>
            <div className="text-muted-foreground">{city}, {state} {zip}</div>
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
  const inspections = data ?? [];
  const [mobileQuery, setMobileQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredMobile = inspections.filter((inspection) => {
    const matchesStatus = statusFilter === "all" || inspection.status === statusFilter;
    if (!matchesStatus) return false;
    if (!mobileQuery.trim()) return true;
    const query = mobileQuery.toLowerCase();
    return (
      inspection.address.toLowerCase().includes(query) ||
      inspection.client.toLowerCase().includes(query)
    );
  });

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "scheduled", label: "Scheduled" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "pending_report", label: "Pending Report" },
  ];

  return (
    <AppShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Inspections"
          description="Manage and track all inspections"
          actions={
            <Button asChild className="sm:w-auto">
              <Link href="/admin/inspections/new">
                <Plus className="mr-2 h-4 w-4" />
                New Inspection
              </Link>
            </Button>
          }
        />

        {/* Inspections Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Inspections</CardTitle>
            <CardDescription>
              {isLoading ? "Loading..." : `${inspections.length} total inspections`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isError ? (
              <div className="text-red-500">Failed to load inspections.</div>
            ) : (
              <>
                <div className="md:hidden space-y-4">
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={mobileQuery}
                        onChange={(event) => setMobileQuery(event.target.value)}
                        placeholder="Search inspections..."
                        className="pl-9"
                      />
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {statusOptions.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={statusFilter === option.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setStatusFilter(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {filteredMobile.length === 0 && !isLoading ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No inspections yet.
                    </div>
                  ) : (
                    filteredMobile.map((inspection) => (
                      <Link
                        key={inspection.inspectionId}
                        href={`/admin/inspections/${inspection.inspectionId}`}
                        className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            {(() => {
                              const { street, city, state, zip } = parseAddress(inspection.address);
                              return (
                                <>
                                  <p className="text-sm font-semibold">{street}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {city}, {state} {zip}
                                  </p>
                                </>
                              );
                            })()}
                          </div>
                          <div className="shrink-0">{getStatusBadge(inspection.status)}</div>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5" />
                            <span>{inspection.client}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {inspection.date} at {inspection.time}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {inspection.types && inspection.types.length > 0 ? inspection.types[0] : ""}
                            </Badge>
                            <span className="font-semibold text-foreground">
                              ${inspection.price}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
                <div className="hidden md:block">
                  <DataTable
                    columns={columns}
                    data={inspections}
                    searchKey="address"
                    searchPlaceholder="Search by property address..."
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
