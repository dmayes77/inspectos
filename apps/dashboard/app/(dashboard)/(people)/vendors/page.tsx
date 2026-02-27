"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { AdminPageSkeleton } from "@/layout/admin-page-skeleton";
import { ModernDataTable } from "@/components/ui/modern-data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2, Mail, Phone, Plus, Search } from "lucide-react";
import { useVendors, type Vendor } from "@/hooks/use-vendors";
import { toSlugIdSegment } from "@/lib/routing/slug-id";

const vendorColumns: ColumnDef<Vendor>[] = [
  {
    accessorKey: "name",
    header: "Vendor",
    enableSorting: true,
    cell: ({ row }) => (
      <div className="min-w-0">
        <Link href={`/vendors/${toSlugIdSegment(row.original.name, row.original.publicId)}`} className="text-sm font-medium hover:underline">
          {row.original.name}
        </Link>
        {row.original.vendorType ? (
          <div className="mt-0.5 text-xs text-muted-foreground">{row.original.vendorType}</div>
        ) : null}
      </div>
    ),
  },
  {
    id: "contact",
    header: "Contact",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="space-y-0.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Mail className="h-3 w-3" />
          <span className="truncate">{row.original.email || "—"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Phone className="h-3 w-3" />
          <span>{row.original.phone || "—"}</span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge color={row.original.status === "active" ? "primary" : "light"}>{row.original.status}</Badge>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row }) => (
      <Button size="sm" variant="outline" asChild>
        <Link href={`/vendors/${toSlugIdSegment(row.original.name, row.original.publicId)}`}>View</Link>
      </Button>
    ),
  },
];

export default function VendorsPage() {
  const { data: vendors = [], isLoading } = useVendors();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const filteredVendors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return vendors.filter((vendor) => {
      const matchesStatus = statusFilter === "all" || vendor.status === statusFilter;
      if (!matchesStatus) return false;
      if (!query) return true;
      return (
        vendor.name.toLowerCase().includes(query) ||
        vendor.vendorType?.toLowerCase().includes(query) ||
        vendor.email?.toLowerCase().includes(query) ||
        vendor.phone?.toLowerCase().includes(query)
      );
    });
  }, [vendors, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const active = vendors.filter((vendor) => vendor.status === "active").length;
    const inactive = vendors.filter((vendor) => vendor.status !== "active").length;
    return { total: vendors.length, active, inactive };
  }, [vendors]);

  if (isLoading) {
    return <AdminPageSkeleton showStats showTable listItems={8} />;
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Vendors"
        description="Manage labs, subcontractors, and supplier relationships"
        actions={
          <Button asChild className="sm:w-auto">
            <Link href="/vendors/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        <StatCard label="Total Vendors" value={stats.total} />
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Inactive" value={stats.inactive} />
      </div>

      <div className="hidden lg:block">
        <ModernDataTable
          columns={vendorColumns}
          data={filteredVendors}
          title="Vendor Directory"
          description={`${filteredVendors.length} vendors`}
          filterControls={
            <>
              <div className="relative w-full md:w-[280px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search vendors"
                  className="h-9 pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button type="button" size="sm" variant={statusFilter === "all" ? "primary" : "outline"} onClick={() => setStatusFilter("all")}>
                  All
                </Button>
                <Button type="button" size="sm" variant={statusFilter === "active" ? "primary" : "outline"} onClick={() => setStatusFilter("active")}>
                  Active
                </Button>
                <Button type="button" size="sm" variant={statusFilter === "inactive" ? "primary" : "outline"} onClick={() => setStatusFilter("inactive")}>
                  Inactive
                </Button>
              </div>
            </>
          }
          emptyState={
            <div className="rounded-md border border-dashed p-10 text-center">
              <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-3 text-lg font-semibold">No vendors found</h3>
              <p className="mt-2 text-sm text-muted-foreground">Add lab partners, contractors, and suppliers to get started.</p>
            </div>
          }
        />
      </div>

      <Card className="card-admin lg:hidden">
        <CardHeader className="pb-2">
          <CardTitle>Vendor Directory</CardTitle>
          <CardDescription>{filteredVendors.length} vendors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search vendors"
                className="h-9 pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button type="button" size="sm" variant={statusFilter === "all" ? "primary" : "outline"} onClick={() => setStatusFilter("all")}>
                All
              </Button>
              <Button type="button" size="sm" variant={statusFilter === "active" ? "primary" : "outline"} onClick={() => setStatusFilter("active")}>
                Active
              </Button>
              <Button type="button" size="sm" variant={statusFilter === "inactive" ? "primary" : "outline"} onClick={() => setStatusFilter("inactive")}>
                Inactive
              </Button>
            </div>
          </div>

          {filteredVendors.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center">
              <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No vendors found</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {filteredVendors.map((vendor) => (
                <Card key={vendor.id} className="card-admin">
                  <CardContent className="space-y-2.5 pt-3">
                    <div className="min-w-0">
                      <Link href={`/vendors/${toSlugIdSegment(vendor.name, vendor.publicId)}`} className="font-medium hover:underline">
                        {vendor.name}
                      </Link>
                      {vendor.vendorType ? <div className="text-xs text-muted-foreground">{vendor.vendorType}</div> : null}
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{vendor.email || "—"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3" />
                        <span>{vendor.phone || "—"}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge color={vendor.status === "active" ? "primary" : "light"}>{vendor.status}</Badge>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/vendors/${toSlugIdSegment(vendor.name, vendor.publicId)}`}>View</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
