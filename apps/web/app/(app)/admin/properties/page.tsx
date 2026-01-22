"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, MapPin, Search, Home, Building, User, Calendar } from "lucide-react";
import { useProperties, formatPropertyAddress, type Property } from "@/hooks/use-properties";
import { mockAdminUser } from "@/lib/constants/mock-users";

const propertyTypeOptions = [
  { value: "all", label: "All Types" },
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "multi-family", label: "Multi-Family" },
  { value: "other", label: "Other" },
];

function getPropertyTypeIcon(type: string) {
  switch (type) {
    case "residential":
      return <Home className="h-4 w-4 text-blue-500" />;
    case "commercial":
      return <Building className="h-4 w-4 text-purple-500" />;
    case "multi-family":
      return <Building className="h-4 w-4 text-amber-500" />;
    default:
      return <MapPin className="h-4 w-4 text-gray-500" />;
  }
}

const columns: ColumnDef<Property>[] = [
  {
    id: "address",
    header: "Address",
    cell: ({ row }) => (
      <Link
        href={`/admin/properties/${row.original.id}`}
        className="flex items-start gap-2 font-medium hover:underline"
      >
        {getPropertyTypeIcon(row.original.property_type)}
        <div>
          <p>{row.original.address_line1}</p>
          {row.original.address_line2 && (
            <p className="text-sm text-muted-foreground">{row.original.address_line2}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {row.original.city}, {row.original.state} {row.original.zip_code}
          </p>
        </div>
      </Link>
    ),
  },
  {
    accessorKey: "property_type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.original.property_type.replace("-", " ")}
      </Badge>
    ),
  },
  {
    id: "client",
    header: "Owner/Contact",
    cell: ({ row }) =>
      row.original.client ? (
        <Link
          href={`/admin/clients/${row.original.client.id}`}
          className="flex items-center gap-2 text-sm hover:underline"
        >
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          {row.original.client.name}
        </Link>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "year_built",
    header: "Year Built",
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.year_built ?? <span className="text-muted-foreground">—</span>}
      </span>
    ),
  },
  {
    accessorKey: "square_feet",
    header: "Size",
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.square_feet ? (
          `${row.original.square_feet.toLocaleString()} sqft`
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </span>
    ),
  },
  {
    id: "created",
    header: "Added",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Calendar className="h-3.5 w-3.5" />
        {new Date(row.original.created_at).toLocaleDateString()}
      </div>
    ),
  },
];

export default function PropertiesPage() {
  const { data, isLoading, isError } = useProperties("demo");
  const properties = data ?? [];
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const matchesType = typeFilter === "all" || property.property_type === typeFilter;
      if (!matchesType) return false;

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const address = formatPropertyAddress(property).toLowerCase();
      const clientName = property.client?.name?.toLowerCase() ?? "";
      return address.includes(query) || clientName.includes(query);
    });
  }, [properties, searchQuery, typeFilter]);

  const stats = useMemo(() => {
    const residential = properties.filter((p) => p.property_type === "residential").length;
    const commercial = properties.filter((p) => p.property_type === "commercial").length;
    const multiFamily = properties.filter((p) => p.property_type === "multi-family").length;
    const other = properties.filter((p) => p.property_type === "other").length;
    return { residential, commercial, multiFamily, other, total: properties.length };
  }, [properties]);

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Properties"
          description="Manage property records and inspection history"
          actions={
            <Button asChild>
              <Link href="/admin/properties/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Link>
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Properties</CardDescription>
              <CardTitle className="text-2xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Residential</CardDescription>
              <CardTitle className="text-2xl">{stats.residential}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Commercial</CardDescription>
              <CardTitle className="text-2xl">{stats.commercial}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Multi-Family</CardDescription>
              <CardTitle className="text-2xl">{stats.multiFamily}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Other</CardDescription>
              <CardTitle className="text-2xl">{stats.other}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search properties..."
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery("");
                  setTypeFilter("all");
                }}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Properties</CardTitle>
            <CardDescription>
              {isLoading ? "Loading..." : `${filteredProperties.length} properties`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isError ? (
              <div className="text-red-500">Failed to load properties.</div>
            ) : filteredProperties.length === 0 && !isLoading ? (
              <div className="rounded-lg border border-dashed p-10 text-center">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No properties yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add your first property to start tracking inspections.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/admin/properties/new">Add Property</Link>
                </Button>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filteredProperties}
                searchKey="address"
                searchPlaceholder="Search by address..."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
