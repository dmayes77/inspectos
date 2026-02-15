"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ModernDataTable } from "@/components/ui/modern-data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, MapPin, Search, User, Calendar } from "lucide-react";
import { useProperties, formatPropertyAddress, Property } from "@/hooks/use-properties";
import { PropertyTypeIcon } from "@/components/properties/property-type-icon";
import { PROPERTY_TYPE_FILTER_OPTIONS } from "@inspectos/shared/constants/property-options";
import { ResourceListLayout } from "@/components/shared/resource-list-layout";
import { AdminPageSkeleton } from "@/components/layout/admin-page-skeleton";
import { formatTimestamp } from "@inspectos/shared/utils/dates";

const createPropertiesColumns = (): ColumnDef<Property>[] => [
  {
    id: "address",
    header: "Address",
    enableHiding: false,
    enableSorting: true,
    cell: ({ row }) => (
      <Link
        href={`/admin/properties/${row.original.id}`}
        className="flex items-start gap-2 hover:underline"
      >
        <PropertyTypeIcon type={row.original.property_type} className="text-xs" />
        <div className="text-xs">
          <p className="font-medium">{row.original.address_line1}</p>
          {row.original.address_line2 && (
            <p className="text-muted-foreground">{row.original.address_line2}</p>
          )}
          <p className="text-muted-foreground">
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
      <Badge variant="outline" className="text-xs capitalize">
        {row.original.property_type.replace("-", " ")}
      </Badge>
    ),
  },
  {
    id: "client",
    header: "Owner/Contact",
    cell: ({ row }) => {
      if (!row.original.client) {
        return <span className="text-xs text-muted-foreground">—</span>;
      }
      return (
        <Link
          href={`/admin/contacts/${row.original.client.id}`}
          className="text-xs hover:underline"
        >
          {row.original.client.name}
        </Link>
      );
    },
  },
  {
    accessorKey: "year_built",
    header: "Year Built",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.year_built ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "square_feet",
    header: "Size",
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.square_feet
          ? `${row.original.square_feet.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} sqft`
          : <span className="text-muted-foreground">—</span>}
      </span>
    ),
  },
  {
    id: "created",
    header: "Added",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Calendar className="h-3.5 w-3.5" />
        {formatTimestamp(row.original.created_at)}
      </div>
    ),
  },
];

export default function PropertiesPage() {
  const { data, isLoading, isError } = useProperties();
  const properties = useMemo(() => data ?? [], [data]);
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
    const singleFamily = properties.filter((p) => p.property_type === "single-family").length;
    const condoTownhome = properties.filter((p) => p.property_type === "condo-townhome").length;
    const commercial = properties.filter((p) => p.property_type === "commercial").length;
    const multiFamily = properties.filter((p) => p.property_type === "multi-family").length;
    const manufactured = properties.filter((p) => p.property_type === "manufactured").length;
    return { singleFamily, condoTownhome, commercial, multiFamily, manufactured, total: properties.length };
  }, [properties]);

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return <AdminPageSkeleton showStats showTable listItems={10} />;
  }

  return (
    <ResourceListLayout
      header={
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
      }
      stats={
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-2xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Single-Family</CardDescription>
              <CardTitle className="text-2xl">{stats.singleFamily}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Condo / Townhome</CardDescription>
              <CardTitle className="text-2xl">{stats.condoTownhome}</CardTitle>
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
              <CardDescription>Manufactured</CardDescription>
              <CardTitle className="text-2xl">{stats.manufactured}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Commercial</CardDescription>
              <CardTitle className="text-2xl">{stats.commercial}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
      table={
        <ModernDataTable
          columns={createPropertiesColumns()}
          data={filteredProperties}
          title="All Properties"
          description={`${filteredProperties.length} properties`}
          filterControls={
            <>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search properties..."
                  className="!pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPE_FILTER_OPTIONS.map((option) => (
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
            </>
          }
          emptyState={
            isError ? (
              <div className="rounded-lg border border-dashed p-10 text-center text-red-500">
                Failed to load properties.
              </div>
            ) : properties.length === 0 ? (
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
              <div className="rounded-lg border border-dashed p-10 text-center">
                <h3 className="text-lg font-semibold">No properties match your filters</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Adjust your search or type filter to find the property you need.
                </p>
              </div>
            )
          }
        />
      }
    />
  );
}
