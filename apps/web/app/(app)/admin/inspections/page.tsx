"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MapPin, Clock, User, Search } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { ModernDataTable } from "@/components/ui/modern-data-table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInspections, useUpdateInspection, type Inspection } from "@/hooks/use-inspections";
import { useServices } from "@/hooks/use-services";
import { mockAdminUser } from "@inspectos/shared/constants/mock-users";
import { inspectionStatusOptions } from "@/lib/admin/badges";
import { can } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";
import { formatDateShort, formatTime12 } from "@inspectos/shared/utils/dates";
import { createServiceMap, getServiceNameById } from "@inspectos/shared/utils/services";
import { PageHeader } from "@/components/layout/page-header";
import { AdminPageSkeleton } from "@/components/layout/admin-page-skeleton";

// Data is loaded from `useInspections` hook so the UI can be built while the API/auth are implemented.
// Keep mock data in the hook as a fallback when the API is not available.

const viewStorageKey = "inspectos_admin_inspections_views";
const stateStorageKey = "inspectos_admin_inspections_state";

type SavedView = {
  id: string;
  name: string;
  statusFilter: string;
  query: string;
};

function getStatusLabel(status: string) {
  if (!status) return "Unknown";
  const match = inspectionStatusOptions.find((option) => option.value === status);
  return match?.label ?? status;
}

function getStatusTriggerClasses(status: string) {
  switch (status) {
    case "scheduled":
      return "bg-muted text-foreground border-muted";
    case "in_progress":
      return "bg-amber-500 text-white border-amber-500";
    case "completed":
      return "bg-green-500 text-white border-green-500";
    case "pending_report":
      return "bg-blue-500 text-white border-blue-500";
    default:
      return "bg-background text-foreground border-input";
  }
}

const getInspectionAddress = (inspection: Inspection) => {
  const property = inspection.summary?.property ?? inspection.order?.property;
  if (property) {
    return [property.address_line1, property.address_line2, `${property.city}, ${property.state} ${property.zip_code}`].filter(Boolean).join(", ");
  }
  return "Property unavailable";
};

const getInspectionClientName = (inspection: Inspection) => {
  return inspection.summary?.client?.name ?? inspection.order?.client?.name ?? "Unknown client";
};

const getInspectionInspectorName = (inspection: Inspection) => {
  return inspection.inspector?.full_name ?? inspection.order?.inspector?.full_name ?? inspection.inspector?.email ?? "Unassigned";
};

const getInspectionDateTime = (inspection: Inspection) => {
  const scheduledDate = inspection.summary?.scheduled_date ?? inspection.order?.scheduled_date ?? inspection.schedule?.slot_date ?? "";
  const scheduledTime = inspection.summary?.scheduled_time ?? inspection.schedule?.slot_start ?? "";
  return {
    dateLabel: scheduledDate ? formatDateShort(scheduledDate) : "Unscheduled",
    timeLabel: scheduledTime ? `at ${formatTime12(scheduledTime)}` : "",
  };
};

const getInspectionServiceIds = (inspection: Inspection) => {
  const summaryServices = inspection.summary?.service_ids;
  if (Array.isArray(summaryServices) && summaryServices.length > 0) return summaryServices;
  const selectedTypeIds = inspection.selected_type_ids;
  if (Array.isArray(selectedTypeIds) && selectedTypeIds.length > 0) return selectedTypeIds;
  if (inspection.schedule?.service_id) return [inspection.schedule.service_id];
  return [];
};

const getInspectionPrice = (inspection: Inspection, serviceMap: Map<string, { serviceId: string; name: string }>) => {
  const serviceIds = getInspectionServiceIds(inspection);
  if (!serviceIds.length) return 0;
  return serviceIds.reduce((sum, id) => {
    const entry = serviceMap.get(id);
    const price = (entry as { price?: number } | undefined)?.price ?? 0;
    return sum + price;
  }, 0);
};

const columns = (
  onStatusChange: (inspectionId: string, status: string) => void,
  getStatus: (inspectionId: string, currentStatus: string) => string,
  serviceMap: Map<string, { serviceId: string; name: string; price: number }>,
): ColumnDef<Inspection>[] => [
  {
    id: "address",
    accessorFn: (row) => {
      const property = row.summary?.property ?? row.order?.property;
      return property
        ? [property.address_line1, property.address_line2, `${property.city}, ${property.state} ${property.zip_code}`].filter(Boolean).join(", ")
        : "";
    },
    header: "Property",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => {
      const address = getInspectionAddress(row.original);
      return (
        <Link href={`/admin/inspections/${row.original.id}`} className="text-xs max-w-xs hover:underline">
          {address}
        </Link>
      );
    },
  },
  {
    accessorKey: "client",
    header: "Client",
    enableSorting: false,
    cell: ({ row }) => <span className="text-xs">{getInspectionClientName(row.original)}</span>,
  },
  {
    accessorKey: "inspector",
    header: "Inspector",
    enableSorting: true,
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{getInspectionInspectorName(row.original)}</span>,
  },
  {
    header: "Date",
    enableSorting: true,
    cell: ({ row }) => {
      const { dateLabel, timeLabel } = getInspectionDateTime(row.original);
      return (
        <div className="text-xs">
          <div>{dateLabel}</div>
          {timeLabel && <div className="text-muted-foreground">{timeLabel}</div>}
        </div>
      );
    },
  },
  {
    accessorKey: "types",
    header: "Type",
    enableSorting: false,
    cell: ({ row }) => {
      const selectedServices = getInspectionServiceIds(row.original);
      const label = selectedServices.length > 0 ? getServiceNameById(selectedServices[0], serviceMap) : "—";
      return <Badge variant="outline" className="text-xs">{label}</Badge>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: true,
    cell: ({ row }) => {
      const inspectionId = row.original.id;
      const currentStatus = getStatus(inspectionId, row.original.status);
      return (
        <Select value={currentStatus} onValueChange={(value) => onStatusChange(inspectionId, value)}>
          <SelectTrigger className={cn("h-7 w-32 text-xs shadow-none", getStatusTriggerClasses(currentStatus))}>
            <SelectValue>{getStatusLabel(currentStatus)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {inspectionStatusOptions
              .filter((option) => option.value !== "all")
              .map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      );
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    enableSorting: true,
    cell: ({ row }) => {
      const amount = getInspectionPrice(row.original, serviceMap);
      return <span className="text-xs font-medium">${amount.toFixed(2)}</span>;
    },
  },
];

export default function InspectionsPage() {
  const { data, isLoading, isError, error } = useInspections();
  const { data: services = [] } = useServices();

  const serviceMap = useMemo(() => createServiceMap(services), [services]) as Map<string, { serviceId: string; name: string; price: number }>;
  const updateInspection = useUpdateInspection();

  // Always show all inspections, sorted by created_at
  const inspections = useMemo(() => {
    if (!data) return [] as Inspection[];
    return Array.isArray(data)
      ? [...data].sort((a, b) => {
          const aTime = a.created_at ? Date.parse(a.created_at) : 0;
          const bTime = b.created_at ? Date.parse(b.created_at) : 0;
          return bTime - aTime;
        })
      : [];
  }, [data]);
  const [mobileQuery, setMobileQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    const storedState = window.localStorage.getItem(stateStorageKey);
    if (!storedState) return "";
    try {
      const parsed = JSON.parse(storedState) as { query?: string };
      return parsed.query || "";
    } catch {
      return "";
    }
  });
  const [statusFilter, setStatusFilter] = useState(() => {
    if (typeof window === "undefined") return "all";
    const storedState = window.localStorage.getItem(stateStorageKey);
    if (!storedState) return "all";
    try {
      const parsed = JSON.parse(storedState) as { statusFilter?: string };
      return parsed.statusFilter || "all";
    } catch {
      return "all";
    }
  });
  const [savedViews, setSavedViews] = useState<SavedView[]>(() => {
    if (typeof window === "undefined") return [];
    const storedViews = window.localStorage.getItem(viewStorageKey);
    if (!storedViews) return [];
    try {
      return JSON.parse(storedViews) as SavedView[];
    } catch {
      return [];
    }
  });
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const userRole = mockAdminUser.role;

  useEffect(() => {
    window.localStorage.setItem(stateStorageKey, JSON.stringify({ statusFilter, query: mobileQuery }));
  }, [statusFilter, mobileQuery]);

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return <AdminPageSkeleton showTable listItems={10} />;
  }

  const filteredMobile = inspections.filter((inspection) => {
    const matchesStatus = statusFilter === "all" || inspection.status === statusFilter;
    if (!matchesStatus) return false;
    if (!mobileQuery.trim()) return true;
    const query = mobileQuery.toLowerCase();
    // Defensive: always treat missing property/client as empty string
    const property = inspection.summary?.property ?? inspection.order?.property;
    const address = property
      ? [property.address_line1, property.address_line2, property.city, property.state, property.zip_code].filter(Boolean).join(", ")
      : "";
    const clientName = inspection.summary?.client?.name ?? inspection.order?.client?.name ?? "";
    return address.toLowerCase().includes(query) || clientName.toLowerCase().includes(query);
  });

  const statusOptions = inspectionStatusOptions;

  const handleSaveView = () => {
    const name = window.prompt("Save view as:");
    if (!name) return;
    const view: SavedView = {
      id: window.crypto?.randomUUID?.() ?? String(Date.now()),
      name,
      statusFilter,
      query: mobileQuery,
    };
    const next = [...savedViews, view];
    setSavedViews(next);
    window.localStorage.setItem(viewStorageKey, JSON.stringify(next));
  };

  const handleApplyView = (viewId: string) => {
    if (viewId === "__all__") {
      setStatusFilter("all");
      setMobileQuery("");
      return;
    }
    const view = savedViews.find((v) => v.id === viewId);
    if (!view) return;
    setStatusFilter(view.statusFilter);
    setMobileQuery(view.query);
  };

  const getStatusValue = (inspectionId: string, currentStatus: string) => statusOverrides[inspectionId] ?? currentStatus ?? "scheduled";

  const handleStatusChange = (inspectionId: string, status: string) => {
    const current = inspections.find((i) => i.id === inspectionId);
    const previousStatus = current?.status ?? "scheduled";

    setStatusOverrides((prev) => ({ ...prev, [inspectionId]: status }));

    updateInspection.mutate(
      { inspectionId, status },
      {
        onSuccess: () => {
          setStatusOverrides((prev) => {
            const next = { ...prev };
            delete next[inspectionId];
            return next;
          });
        },
        onError: () => {
          setStatusOverrides((prev) => ({ ...prev, [inspectionId]: previousStatus }));
        },
      },
    );
  };

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <PageHeader
          title="Inspections"
          description="Manage and track all inspections"
          actions={
            can(userRole, "create_inspections") ? (
              <Button asChild className="sm:w-auto">
                <Link href="/admin/inspections/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Inspection
                </Link>
              </Button>
            ) : null
          }
        />

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <Select onValueChange={handleApplyView}>
                <SelectTrigger className="w-50">
                  <SelectValue placeholder="Saved views" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Inspections</SelectItem>
                  {savedViews.map((view) => (
                    <SelectItem key={view.id} value={view.id}>
                      {view.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleSaveView}>
                Save view
              </Button>
              <Button variant="ghost" onClick={() => handleApplyView("__all__")}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mobile View - Custom Cards */}
        <div className="md:hidden space-y-4">
          {isError ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-red-500">
                Failed to load inspections.
                {error instanceof Error && <span className="ml-2 text-xs">{error.message}</span>}
              </p>
            </div>
          ) : (
            <>
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
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <p className="text-sm text-muted-foreground">No inspections yet.</p>
                </div>
              ) : (
                filteredMobile.map((inspection, index) => {
                  const address = getInspectionAddress(inspection);
                  const selectedServices = getInspectionServiceIds(inspection);
                  const serviceLabel = selectedServices.length > 0 ? getServiceNameById(selectedServices[0], serviceMap) : "";
                  const inspectionPrice = getInspectionPrice(inspection, serviceMap);
                  return (
                    <Link
                      key={inspection.id || `inspection-${index}`}
                      href={`/admin/inspections/${inspection.id}`}
                      className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{address}</p>
                        </div>
                        <div className="shrink-0">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                              getStatusTriggerClasses(getStatusValue(inspection.id, inspection.status)),
                            )}
                          >
                            {getStatusLabel(getStatusValue(inspection.id, inspection.status))}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5" />
                          <span>{getInspectionClientName(inspection)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {getInspectionDateTime(inspection).dateLabel} {getInspectionDateTime(inspection).timeLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{serviceLabel || "—"}</Badge>
                          <span className="font-semibold text-foreground">${inspectionPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </>
          )}
        </div>

        {/* Desktop View - ModernDataTable */}
        <div className="hidden md:block">
          <ModernDataTable
            columns={columns(handleStatusChange, getStatusValue, serviceMap)}
            data={inspections}
            title="All Inspections"
            description={`${inspections.length} total inspections`}
            emptyState={
              isError ? (
                <div className="rounded-lg border border-dashed p-10 text-center">
                  <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold text-red-500">Failed to load inspections</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {error instanceof Error ? error.message : "Please try refreshing the page."}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-10 text-center">
                  <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No inspections yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Create your first inspection to start tracking jobs.</p>
                  {can(userRole, "create_inspections") && (
                    <Button asChild className="mt-6">
                      <Link href="/admin/inspections/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Inspection
                      </Link>
                    </Button>
                  )}
                </div>
              )
            }
          />
        </div>
      </div>
    </AdminShell>
  );
}
