"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Plus, MapPin, Search, User } from "lucide-react";
import { useProperties, formatPropertyAddress } from "@/hooks/use-properties";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { propertiesTableColumns } from "@/components/properties/properties-table-columns";
import { PropertyTypeIcon } from "@/components/properties/property-type-icon";
import { PROPERTY_TYPE_FILTER_OPTIONS } from "@/lib/constants/property-options";
import { ResourceListLayout } from "@/components/shared/resource-list-layout";

export default function PropertiesPage() {
  const tenantSlug = process.env.NEXT_PUBLIC_SUPABASE_TENANT_ID ?? "demo";
  const { data, isLoading, isError } = useProperties(tenantSlug);
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
    const singleFamily = properties.filter((p) => p.property_type === "single-family").length;
    const condoTownhome = properties.filter((p) => p.property_type === "condo-townhome").length;
    const commercial = properties.filter((p) => p.property_type === "commercial").length;
    const multiFamily = properties.filter((p) => p.property_type === "multi-family").length;
    const manufactured = properties.filter((p) => p.property_type === "manufactured").length;
    return { singleFamily, condoTownhome, commercial, multiFamily, manufactured, total: properties.length };
  }, [properties]);

  return (
    <AdminShell user={mockAdminUser}>
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
        filters={
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
              </div>
            </CardContent>
          </Card>
        }
        table={
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
                <>
                  <div className="space-y-3 md:hidden">
                    {filteredProperties.map((property) => (
                      <Link
                        key={property.id}
                        href={`/admin/properties/${property.id}`}
                        className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-start gap-3">
                          <PropertyTypeIcon type={property.property_type} />
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold leading-tight">{property.address_line1}</p>
                                {property.address_line2 && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {property.address_line2}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  {property.city}, {property.state} {property.zip_code}
                                </p>
                              </div>
                              <Badge variant="outline" className="shrink-0 capitalize">
                                {property.property_type.replace("-", " ")}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5" />
                                {property.client?.name ?? "No client"}
                              </span>
                              <span>
                                {property.square_feet
                                  ? `${property.square_feet.toLocaleString()} sqft`
                                  : "Size —"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="hidden md:block">
                    <DataTable columns={propertiesTableColumns} data={filteredProperties} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        }
      />
    </AdminShell>
  );
}
