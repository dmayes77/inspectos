from pathlib import Path
from textwrap import dedent

content = dedent(
    """\
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useServices, useDeleteService } from "@/hooks/use-services";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { mockAdminUser } from "@/lib/constants/mock-users";
import { can } from "@/lib/admin/permissions";
import { ResourceListLayout } from "@/components/shared/resource-list-layout";

export default function ServicesAdminPage() {
    const { data: allServices = [], isLoading, isError, error } = useServices();
    const deleteService = useDeleteService();
    const [mobileQuery, setMobileQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<"all" | "service" | "addon" | "package">("all");
    const userRole = mockAdminUser.role;

    const filteredByType = useMemo(() => {
        return allServices.filter((service) => {
            return (
                typeFilter === "all" ||
                (typeFilter === "package" && service.isPackage) ||
                (typeFilter === "addon" && service.category === "addon") ||
                (typeFilter === "service" && !service.isPackage && service.category !== "addon")
            );
        });
    }, [allServices, typeFilter]);

    const filteredMobile = useMemo(() => {
        if (!mobileQuery.trim()) return filteredByType;
        const query = mobileQuery.toLowerCase();
        return filteredByType.filter((service) => {
            return (
                service.name.toLowerCase().includes(query) ||
                (service.description || "").toLowerCase().includes(query)
            );
        });
    }, [filteredByType, mobileQuery]);

    const typeOptions = [
        { value: "all" as const, label: "All" },
        { value: "service" as const, label: "Services" },
        { value: "addon" as const, label: "Add-ons" },
        { value: "package" as const, label: "Packages" },
    ];

    const handleArchive = (serviceId: string) => {
        if (!window.confirm("Archive this service? This will deactivate it but not permanently delete it.")) {
            return;
        }
        deleteService.mutate(serviceId, {
            onSuccess: () => toast.success("Service archived"),
            onError: (error: unknown) => {
                const message = error instanceof Error ? error.message : "Failed to archive service";
                toast.error(message);
            },
        });
    };

    return (
        <AdminShell user={mockAdminUser}>
            <ResourceListLayout
                header={
                    <AdminPageHeader
                        title="Services & Packages"
                        description="Define individual services and create bundled packages"
                        actions={
                            can(userRole, "manage_billing") ? (
                                <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                                    <Button asChild>
                                        <Link href="/admin/services/new?mode=service">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create Service
                                        </Link>
                                    </Button>
                                    <Button asChild>
                                        <Link href="/admin/services/new?mode=package">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create Package
                                        </Link>
                                    </Button>
                                </div>
                            ) : null
                        }
                    />
                }
                filters={
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={mobileQuery}
                                        onChange={(event) => setMobileQuery(event.target.value)}
                                        placeholder="Search services..."
                                        className="pl-9"
                                    />
                                </div>
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Filter by type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {typeOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setMobileQuery("");
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
                            <CardTitle>All Services & Packages</CardTitle>
                            <CardDescription>
                                {isLoading
                                    ? "Loading..."
                                    : `${allServices.length} total (${allServices.filter((s) => !s.isPackage).length} services, ${
                                          allServices.filter((s) => s.isPackage).length
                                      } packages)`}
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
                            ) : allServices.length === 0 && !isLoading ? (
                                <div className="rounded-lg border border-dashed p-10 text-center">
                                    <h3 className="text-lg font-semibold">No services yet</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Create your first service to start building packages.
                                    </p>
                                    {can(userRole, "manage_billing") && (
                                        <Button className="mt-4" asChild>
                                            <Link href="/admin/services/new?mode=service">Create service</Link>
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="md:hidden space-y-4">
                                        <div className="space-y-3">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    value={mobileQuery}
                                                    onChange={(event) => setMobileQuery(event.target.value)}
                                                    placeholder="Search services..."
                                                    className="pl-9"
                                                />
                                            </div>
                                            <div className="flex flex-wrap justify-center gap-2">
                                                {typeOptions.map((option) => (
                                                    <Button
                                                        key={option.value}
                                                        type="button"
                                                        variant={typeFilter === option.value ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setTypeFilter(option.value)}
                                                    >
                                                        {option.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                        {filteredMobile.length === 0 ? (
                                            <div className="py-6 text-center text-sm text-muted-foreground">No services found.</div>
                                        ) : (
                                            filteredMobile.map((service) => (
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
                                                            <p className="text-xs text-muted-foreground">
                                                                {service.durationMinutes ? `${service.durationMinutes / 60}h` : "—"}
                                                            </p>
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
                                                            <Link href={`/admin/services/${row.original.serviceId}`} className="text-primary hover:underline">
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
                                                    cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.description || "—"}</span>,
                                                },
                                                {
                                                    accessorKey: "price",
                                                    header: "Price",
                                                    cell: ({ row }) => (row.original.price ? `$${row.original.price.toFixed(2)}` : "—"),
                                                },
                                                {
                                                    accessorKey: "durationMinutes",
                                                    header: "Duration",
                                                    cell: ({ row }) => (row.original.durationMinutes ? `${row.original.durationMinutes / 60}h` : "—"),
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
                                            searchKey="name"
                                            searchPlaceholder="Search services and packages..."
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
"""
)

Path("apps/web/app/(app)/admin/services/page.tsx").write_text(content)
