"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MapPin, Clock, User, Search } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInspections, useUpdateInspection, type Inspection } from "@/hooks/use-inspections";
import { useServices } from "@/hooks/use-services";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { inspectionStatusOptions } from "@/lib/admin/badges";
import { can } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";
import { formatDateShort, formatTime12 } from "@/lib/utils/dates";
import { createServiceMap, getServiceNameById } from "@/lib/utils/services";

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

const columns = (
  onStatusChange: (inspectionId: string, status: string) => void,
  getStatus: (inspectionId: string, currentStatus: string) => string,
  serviceMap: Map<string, { serviceId: string; name: string }>
): ColumnDef<Inspection>[] => [
  {
    id: "address",
    accessorFn: (row) => {
      const property = row.job?.property;
      return property
        ? [property.address_line1, property.address_line2, `${property.city}, ${property.state} ${property.zip_code}`]
            .filter(Boolean)
            .join(", ")
        : "";
    },
    header: "Property",
    enableSorting: false,
    cell: ({ row }) => {
      const property = row.original.job?.property;
      const address = property
        ? [property.address_line1, property.address_line2, `${property.city}, ${property.state} ${property.zip_code}`]
            .filter(Boolean)
            .join(", ")
        : "Property unavailable";
      return (
        <Link
          href={`/admin/inspections/${row.original.id}`}
          className="flex items-start gap-2 max-w-xs hover:text-foreground"
        >
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium">{address}</div>
          </div>
        </Link>
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
        <span className="text-sm">{row.original.job?.client?.name || "Unknown client"}</span>
      </div>
    ),
  },
  {
    accessorKey: "inspector",
    header: "Inspector",
    enableSorting: true,
    cell: ({ row }) => (
      <div className="text-sm max-w-xs">
        {row.original.inspector?.full_name || row.original.inspector?.email || "Unassigned"}
      </div>
    ),
  },
  {
    accessorKey: "date",
    header: "Date",
    enableSorting: true,
    cell: ({ row }) => (
      <div className="text-sm">
        <div>{row.original.job?.scheduled_date ? formatDateShort(row.original.job.scheduled_date) : "Unscheduled"}</div>
        <div className="text-muted-foreground">
          {row.original.job?.scheduled_time ? formatTime12(row.original.job.scheduled_time) : "—"}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "types",
    header: "Type",
    enableSorting: false,
    cell: ({ row }) => {
      const selectedServices = row.original.job?.selected_service_ids || [];
      const label = selectedServices.length > 0 ? getServiceNameById(selectedServices[0], serviceMap) : "";
      return <Badge variant="outline">{label}</Badge>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: true,
    cell: ({ row }) => (
      <Select
        value={getStatus(row.original.id, row.original.status)}
        onValueChange={(value) => onStatusChange(row.original.id, value)}
      >
        <SelectTrigger
          className={cn(
            "h-8 w-[160px] font-medium shadow-none",
            getStatusTriggerClasses(getStatus(row.original.id, row.original.status))
          )}
        >
          <SelectValue>{getStatusLabel(getStatus(row.original.id, row.original.status))}</SelectValue>
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
    ),
  },
  {
    accessorKey: "price",
    header: "Price",
    enableSorting: true,
    cell: () => <div className="text-sm font-medium">$0</div>,
  },
];

export default function InspectionsPage() {
  const { data, isLoading, isError } = useInspections();
  const { data: services = [] } = useServices();
  const serviceMap = useMemo(() => createServiceMap(services), [services]);
  const updateInspection = useUpdateInspection();
  const inspections = data ?? [];
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
    window.localStorage.setItem(
      stateStorageKey,
      JSON.stringify({ statusFilter, query: mobileQuery })
    );
  }, [statusFilter, mobileQuery]);

  const filteredMobile = inspections.filter((inspection) => {
    const matchesStatus = statusFilter === "all" || inspection.status === statusFilter;
    if (!matchesStatus) return false;
    if (!mobileQuery.trim()) return true;
    const query = mobileQuery.toLowerCase();
    const property = inspection.job?.property;
    const address = property
      ? [property.address_line1, property.address_line2, `${property.city}, ${property.state} ${property.zip_code}`]
          .filter(Boolean)
          .join(", ")
      : "";
    return (
      address.toLowerCase().includes(query) ||
      (inspection.job?.client?.name || "").toLowerCase().includes(query)
    );
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

  const getStatusValue = (inspectionId: string, currentStatus: string) =>
    statusOverrides[inspectionId] ?? currentStatus;

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
      }
    );
  };

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
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
                <SelectTrigger className="w-[200px]">
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
                    filteredMobile.map((inspection) => {
                      const property = inspection.job?.property;
                      const address = property
                        ? [property.address_line1, property.address_line2, `${property.city}, ${property.state} ${property.zip_code}`]
                            .filter(Boolean)
                            .join(", ")
                        : "Property unavailable";
                      const selectedServices = inspection.job?.selected_service_ids || [];
                      const serviceLabel = selectedServices.length > 0 ? getServiceNameById(selectedServices[0], serviceMap) : "";
                      return (
                      <Link
                        key={inspection.id}
                        href={`/admin/inspections/${inspection.id}`}
                        className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            {(() => {
                              return (
                                <>
                                  <p className="text-sm font-semibold">{address}</p>
                                </>
                              );
                            })()}
                          </div>
                          <div className="shrink-0">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                getStatusTriggerClasses(
                                  getStatusValue(inspection.id, inspection.status)
                                )
                              )}
                            >
                              {getStatusLabel(getStatusValue(inspection.id, inspection.status))}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5" />
                            <span>{inspection.job?.client?.name || "Unknown client"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {inspection.job?.scheduled_date ? formatDateShort(inspection.job.scheduled_date) : "Unscheduled"}{" "}
                              {inspection.job?.scheduled_time ? `at ${formatTime12(inspection.job.scheduled_time)}` : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {serviceLabel}
                            </Badge>
                            <span className="font-semibold text-foreground">
                              $0
                            </span>
                          </div>
                        </div>
                      </Link>
                    )})
                  )}
                </div>
                <div className="hidden md:block">
                  {inspections.length === 0 && !isLoading ? (
                    <div className="rounded-lg border border-dashed p-10 text-center">
                      <h3 className="text-lg font-semibold">No inspections yet</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Create your first inspection to start tracking jobs.
                      </p>
                      {can(userRole, "create_inspections") && (
                        <Button asChild className="mt-4">
                          <Link href="/admin/inspections/new">Create inspection</Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                  <DataTable
                      columns={columns(handleStatusChange, getStatusValue, serviceMap)}
                    data={inspections}
                    searchKey="address"
                    searchPlaceholder="Search by property address..."
                  />
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
