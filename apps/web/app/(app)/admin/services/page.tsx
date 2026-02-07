"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { useServices, useDeleteService } from "@/hooks/use-services";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { can } from "@/lib/admin/permissions";
import { ResourceListLayout } from "@/components/shared/resource-list-layout";
import { AdminPageSkeleton } from "@/components/layout/admin-page-skeleton";

type FilterValue = "all" | "service" | "addon" | "package";

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "service", label: "Services" },
  { value: "addon", label: "Add-ons" },
  { value: "package", label: "Packages" },
];

const formatDuration = (minutes?: number) => {
  if (!minutes) return "—";
  const hours = minutes / 60;
  const label = Number.isInteger(hours) ? hours.toString() : hours.toFixed(1);
  return `${label}h`;
};

export default function ServicesAdminPage() {
  const { data: allServices = [], isLoading, isError, error } = useServices();
  const deleteService = useDeleteService();
  const [typeFilter, setTypeFilter] = useState<FilterValue>("all");
  const userRole = mockAdminUser.role;

  const filteredByType = useMemo(() => {
    return allServices.filter((service) => {
      return (
        typeFilter === "all" ||
        (typeFilter === "package" && service.isPackage) ||
        (typeFilter === "addon" && service.category === "addon" && !service.isPackage) ||
        (typeFilter === "service" && !service.isPackage && service.category !== "addon")
      );
    });
  }, [allServices, typeFilter]);

  const stats = useMemo(() => {
    const total = allServices.length;
    const services = allServices.filter((service) => !service.isPackage).length;
    const packages = allServices.filter((service) => service.isPackage).length;
    const addOns = allServices.filter((service) => service.category === "addon" && !service.isPackage).length;
    return { total, services, packages, addOns };
  }, [allServices]);

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return <AdminPageSkeleton showStats showTable listItems={10} />;
  }

  const hasNoServices = allServices.length === 0 && !isLoading;
  const hasNoMatches = filteredByType.length === 0 && allServices.length > 0 && !isLoading;

  const handleArchive = (id: string) => {
    if (!window.confirm("Archive this service? This will deactivate it but not permanently delete it.")) {
      return;
    }
    deleteService.mutate(id, {
      onSuccess: () => toast.success("Service archived"),
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : "Failed to archive service";
        toast.error(message);
      },
    });
  };

  const typeButtons = FILTER_OPTIONS.map((option) => (
    <Button
      key={option.value}
      type="button"
      size="sm"
      variant={typeFilter === option.value ? "default" : "outline"}
      onClick={() => setTypeFilter(option.value)}
    >
      {option.label}
    </Button>
  ));

  return (
    <AdminShell user={mockAdminUser}>
      <ResourceListLayout
        header={
          <AdminPageHeader
            title="Services & Packages"
            description="Define individual services and bundle them into packages."
            actions={
              can(userRole, "manage_billing") ? (
                <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                  <Button asChild>
                    <Link href="/admin/services/new?mode=service">
                      <Plus className="mr-2 h-4 w-4" /> Create Service
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/admin/services/new?mode=package">
                      <Plus className="mr-2 h-4 w-4" /> Create Package
                    </Link>
                  </Button>
                </div>
              ) : null
            }
          />
        }
        stats={
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total</CardDescription>
                <CardTitle className="text-2xl">{stats.total}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Services</CardDescription>
                <CardTitle className="text-2xl">{stats.services}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Add-ons</CardDescription>
                <CardTitle className="text-2xl">{stats.addOns}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Packages</CardDescription>
                <CardTitle className="text-2xl">{stats.packages}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        }
        table={
          <Card>
            <CardHeader>
              <CardTitle>All Services & Packages</CardTitle>
              <CardDescription>
                {isLoading
                  ? "Loading..."
                  : `${stats.total} total (${stats.services} services, ${stats.packages} packages)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isError ? (
                <div className="text-red-500">
                  Failed to load services.
                  {error instanceof Error && (
                    <span className="ml-2 text-xs text-muted-foreground">{error.message}</span>
                  )}
                </div>
              ) : hasNoServices ? (
                <div className="rounded-lg border border-dashed p-10 text-center">
                  <h3 className="text-lg font-semibold">No services yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Create your first service or package to get started.
                  </p>
                  {can(userRole, "manage_billing") && (
                    <Button className="mt-4" asChild>
                      <Link href="/admin/services/new?mode=service">Create service</Link>
                    </Button>
                  )}
                </div>
              ) : hasNoMatches ? (
                <div className="rounded-lg border border-dashed p-10 text-center">
                  <h3 className="text-lg font-semibold">No services match your filters</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Adjust your search or type filter to find the service you need.
                  </p>
                </div>
              ) : (
                <>
                  <div className="md:hidden space-y-4">
                    <div className="flex flex-wrap items-center gap-2">{typeButtons}</div>
                    {filteredByType.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">No services found.</div>
                    ) : (
                      filteredByType.map((service) => (
                        <Link
                          key={service.serviceId}
                          href={`/admin/services/${service.serviceId}`}
                          className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold">{service.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {service.description || "No description"}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-semibold">
                                {service.price ? `$${service.price.toFixed(2)}` : "—"}
                              </p>
                              <p className="text-xs text-muted-foreground">{formatDuration(service.durationMinutes)}</p>
                              {service.isPackage ? (
                                <Badge variant="secondary" className="mt-1">
                                  Package
                                </Badge>
                              ) : service.category === "addon" ? (
                                <Badge variant="outline" className="mt-1">
                                  Add-on
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                  <div className="hidden md:block">
                    <DataTable
                      columns={[
                        {
                          accessorKey: "name",
                          header: "Name",
                          enableHiding: false,
                          cell: ({ row }) => (
                            <div className="font-medium flex items-center gap-2">
                              <Link
                                href={`/admin/services/${row.original.serviceId}`}
                                className="text-primary hover:underline"
                              >
                                {row.original.name}
                              </Link>
                              {row.original.isPackage && <Badge variant="secondary">Package</Badge>}
                            </div>
                          ),
                        },
                        {
                          accessorKey: "description",
                          header: "Description",
                          enableSorting: false,
                          cell: ({ row }) => (
                            <span className="text-muted-foreground text-sm">
                              {row.original.description || "—"}
                            </span>
                          ),
                        },
                        {
                          accessorKey: "price",
                          header: "Price",
                          cell: ({ row }) => (row.original.price ? `$${row.original.price.toFixed(2)}` : "—"),
                        },
                        {
                          accessorKey: "durationMinutes",
                          header: "Duration",
                          cell: ({ row }) => formatDuration(row.original.durationMinutes),
                        },
                        {
                          id: "actions",
                          header: "Actions",
                          cell: ({ row }) =>
                            can(userRole, "manage_billing") ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleArchive(row.original.serviceId)}
                              >
                                Archive
                              </Button>
                            ) : (
                              <span className="text-sm text-muted-foreground">No access</span>
                            ),
                        },
                      ]}
                      data={filteredByType}
                      toolbarActions={typeButtons}
                    />
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
