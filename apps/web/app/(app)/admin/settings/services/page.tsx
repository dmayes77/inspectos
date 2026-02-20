"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModernDataTable } from "@/components/ui/modern-data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { useServices, useDeleteService, type Service } from "@/hooks/use-services";
import { useProfile } from "@/hooks/use-profile";
import { can } from "@/lib/admin/permissions";
import { ResourceListLayout } from "@/components/shared/resource-list-layout";
import { AdminPageSkeleton } from "@/layout/admin-page-skeleton";

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

const createServicesColumns = (
  userRole: string,
  userPermissions: string[],
  handleArchive: (id: string) => void
): ColumnDef<Service>[] => [
  {
    accessorKey: "name",
    header: "Name",
    enableHiding: false,
    enableSorting: true,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Link
          href={`/admin/services/${row.original.serviceId}`}
          className="text-xs font-medium hover:underline"
        >
          {row.original.name}
        </Link>
        {row.original.isPackage && <Badge color="light" className="text-xs">Package</Badge>}
      </div>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.description || "—"}
      </span>
    ),
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => <span className="text-xs font-medium">{row.original.price ? `$${row.original.price.toFixed(2)}` : "—"}</span>,
  },
  {
    accessorKey: "durationMinutes",
    header: "Duration",
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDuration(row.original.durationMinutes)}</span>,
  },
  {
    id: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row }) =>
      can(userRole, "manage_billing", userPermissions) ? (
        <Button
          variant="destructive"
         
          onClick={() => handleArchive(row.original.serviceId)}
          className="h-7 text-xs"
        >
          Archive
        </Button>
      ) : (
        <span className="text-xs text-muted-foreground">No access</span>
      ),
  },
];

export default function ServicesAdminPage() {
  const { data: allServices = [], isLoading, isError, error } = useServices();
  const { data: profile } = useProfile();
  const deleteService = useDeleteService();
  const [typeFilter, setTypeFilter] = useState<FilterValue>("all");
  const userRole = (profile?.role ?? "").toUpperCase();
  const userPermissions = profile?.permissions ?? [];

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
     
      variant={typeFilter === option.value ? "primary" : "outline"}
      onClick={() => setTypeFilter(option.value)}
    >
      {option.label}
    </Button>
  ));

  return (
    <ResourceListLayout
      header={
        <AdminPageHeader
          title="Services & Packages"
          description="Define individual services and bundle them into packages."
          actions={
            can(userRole, "manage_billing", userPermissions) ? (
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
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Services" value={stats.services} />
          <StatCard label="Add-ons" value={stats.addOns} />
          <StatCard label="Packages" value={stats.packages} />
        </div>
      }
      table={
        <ModernDataTable
          columns={createServicesColumns(userRole, userPermissions, handleArchive)}
          data={filteredByType}
          title="All Services & Packages"
          description={`${stats.total} total (${stats.services} services, ${stats.packages} packages)`}
          filterControls={
            <div className="flex flex-wrap items-center gap-2">{typeButtons}</div>
          }
          emptyState={
            isError ? (
              <div className="rounded-lg border border-dashed p-10 text-center text-red-500">
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
                {can(userRole, "manage_billing", userPermissions) && (
                  <Button className="mt-4" asChild>
                    <Link href="/admin/services/new?mode=service">Create service</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-10 text-center">
                <h3 className="text-lg font-semibold">No services match your filters</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Adjust your search or type filter to find the service you need.
                </p>
              </div>
            )
          }
        />
      }
    />
  );
}
