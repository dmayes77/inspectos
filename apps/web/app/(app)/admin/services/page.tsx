"use client";

import { useState } from "react";
import Link from "next/link";
import { useServices, useCreateService, useUpdateService, useDeleteService, Service } from "@/hooks/use-services";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { IncludesEditor } from "@/components/ui/includes-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { mockAdminUser } from "@/lib/constants/mock-users";
import { calculatePackageDiscount } from "@/lib/utils/pricing";
import { serviceSchema } from "@/lib/validations/service";
import { can } from "@/lib/admin/permissions";
import { useCreateTemplateStub, useTemplates } from "@/hooks/use-templates";

export default function ServicesAdminPage() {
  const { data: allServices = [], isLoading } = useServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [form, setForm] = useState<Partial<Service>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const individualServices = allServices.filter((s) => !s.isPackage);
  const [mobileQuery, setMobileQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "service" | "addon" | "package">("all");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const userRole = mockAdminUser.role;
  const durationOptions = [30, 60, 90, 120, 180, 240, 300];
  const [templateMode, setTemplateMode] = useState<"existing" | "new">("existing");
  const [templateSelection, setTemplateSelection] = useState<string>("");
  const [templateName, setTemplateName] = useState<string>("");
  const { data: templatesData = [] } = useTemplates();
  const templates = templatesData.filter((template) => template.type === "inspection");
  const createTemplateStubMutation = useCreateTemplateStub();

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "—";
    const hours = minutes / 60;
    const label = Number.isInteger(hours) ? hours.toString() : hours.toFixed(1);
    return `${label}h`;
  };

  const filteredByType = allServices.filter((service) => {
    return (
      typeFilter === "all" ||
      (typeFilter === "package" && service.isPackage) ||
      (typeFilter === "addon" && service.category === "addon") ||
      (typeFilter === "service" && !service.isPackage && service.category !== "addon")
    );
  });

  const filteredMobile = filteredByType.filter((service) => {
    if (!mobileQuery.trim()) return true;
    const query = mobileQuery.toLowerCase();
    return (
      service.name.toLowerCase().includes(query) ||
      (service.description || "").toLowerCase().includes(query)
    );
  });

  const typeOptions = [
    { value: "all" as const, label: "All" },
    { value: "service" as const, label: "Services" },
    { value: "addon" as const, label: "Add-ons" },
    { value: "package" as const, label: "Packages" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleServiceSelect = (id: string, checked: boolean) => {
    const updatedIds = checked ? [...selectedServiceIds, id] : selectedServiceIds.filter((sid) => sid !== id);

    setSelectedServiceIds(updatedIds);

    // Auto-combine includes from all selected services
    if (form.isPackage) {
      const combinedIncludes = updatedIds.flatMap((serviceId) => {
        const service = allServices.find((s) => s.serviceId === serviceId);
        return service?.includes || [];
      });
      // Remove duplicates
      const uniqueIncludes = Array.from(new Set(combinedIncludes));
      const totalDuration = updatedIds.reduce((sum, serviceId) => {
        const service = allServices.find((s) => s.serviceId === serviceId);
        return sum + (service?.durationMinutes || 0);
      }, 0);
      setForm((f) => ({ ...f, includes: uniqueIncludes, durationMinutes: totalDuration || f.durationMinutes }));
    }
  };

  const handleDiscountChange = (percent: number) => {
    setDiscountPercent(percent);

    // Auto-calculate price based on discount
    const totalIndividualPrice = selectedServiceIds.reduce((sum, id) => {
      const service = allServices.find((s) => s.serviceId === id);
      return sum + (service?.price || 0);
    }, 0);

    const discountedPrice = totalIndividualPrice * (1 - percent / 100);
    // Round up to nearest 5 (e.g., $697.50 → $700, $692.34 → $695)
    const roundedPrice = Math.ceil(discountedPrice / 5) * 5;
    setForm((f) => ({ ...f, price: roundedPrice }));
  };

  const getPackageDiscount = (includedIds: string[]) => {
    const includedServices = includedIds
      .map((id) => allServices.find((s) => s.serviceId === id))
      .filter((s): s is NonNullable<typeof s> => s !== undefined);
    
    const packageService = {
      serviceId: "",
      name: "",
      price: parseFloat(String(form.price)) || 0,
      isPackage: true,
      includedServiceIds: includedIds,
    };
    
    return calculatePackageDiscount(packageService, includedServices);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: packages must have services
    if (form.isPackage) {
      if (selectedServiceIds.length === 0) {
        toast.error("Packages must include at least one service");
        return;
      }
    }

    let templateId = form.templateId ?? null;
    if (!form.isPackage) {
      if (templateMode === "new") {
        const name = templateName || String(form.name || "New Template");
        try {
          const stub = await createTemplateStubMutation.mutateAsync({ name });
          templateId = stub.id;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to create template stub";
          toast.error(message);
          return;
        }
      } else if (templateMode === "existing") {
        templateId = !templateSelection || templateSelection === "none" ? null : templateSelection;
      }
    }

    const payload = {
      ...form,
      templateId,
      includedServiceIds: form.isPackage ? selectedServiceIds : form.includedServiceIds,
    };

    const parsed = serviceSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Please check the service details");
      return;
    }

    if (editingId) {
      updateService.mutate(
        { serviceId: editingId, ...payload },
        {
          onSuccess: () => {
            toast.success("Service updated successfully");
            resetForm();
          },
          onError: (error: unknown) => {
            if (error && typeof error === "object" && "message" in error) {
              toast.error((error as { message?: string }).message || "Failed to update service");
            } else {
              toast.error("Failed to update service");
            }
          },
        }
      );
    } else {
      createService.mutate(payload, {
        onSuccess: () => {
          toast.success(`${form.isPackage ? "Package" : "Service"} created successfully`);
          resetForm();
        },
        onError: (error: unknown) => {
          if (error && typeof error === "object" && "message" in error) {
            toast.error((error as { message?: string }).message || "Failed to create service");
          } else {
            toast.error("Failed to create service");
          }
        },
      });
    }
  };

  const resetForm = () => {
    setForm({});
    setEditingId(null);
    setSelectedServiceIds([]);
    setDiscountPercent(0);
    setShowServiceForm(false);
    setShowPackageForm(false);
  };

  const handleArchive = (id: string) => {
    if (window.confirm("Archive this service? This will deactivate it but not permanently delete it.")) {
      deleteService.mutate(id, {
        onSuccess: () => {
          toast.success("Service archived successfully");
          if (editingId === id) {
            resetForm();
          }
        },
        onError: (error: unknown) => {
          if (error && typeof error === "object" && "message" in error) {
            toast.error((error as { message?: string }).message || "Failed to archive service");
          } else {
            toast.error("Failed to archive service");
          }
        },
      });
    }
  };

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Services & Packages"
          description="Define individual services and create bundled packages"
          actions={
            can(userRole, "manage_billing") ? (
              <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                  <Button
                  onClick={() => {
                    setShowServiceForm(true);
                    setShowPackageForm(false);
                      setForm({ isPackage: false, category: "core", templateId: null });
                    setEditingId(null);
                    setDiscountPercent(0);
                      setTemplateMode("existing");
                      setTemplateSelection("");
                      setTemplateName("");
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Service
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (individualServices.length === 0) {
                      toast.error("Create at least one service before creating a package");
                      return;
                    }
                    setShowPackageForm(true);
                    setShowServiceForm(false);
                    setForm({ isPackage: true });
                    setEditingId(null);
                    setSelectedServiceIds([]);
                    setDiscountPercent(0);
                  }}
                  disabled={individualServices.length === 0}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Package
                </Button>
              </div>
            ) : null
          }
        />

        {individualServices.length === 0 && !showServiceForm && (
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No services yet. Create individual services first, then bundle them into packages.</p>
            </CardContent>
          </Card>
        )}

        {/* Inline form for creating/editing service */}
        {showServiceForm && (
          <Card className="my-4">
            <CardHeader>
              <CardTitle>{editingId ? "Edit Service" : "Create Service"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input name="name" value={form.name || ""} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea name="description" value={form.description || ""} onChange={handleChange} placeholder="Brief overview of the service" rows={2} />
                </div>
                <IncludesEditor includes={form.includes || []} onChange={(includes) => setForm((f) => ({ ...f, includes }))} />
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <div className="flex flex-wrap gap-2">
                    {durationOptions.map((minutes) => (
                      <Button
                        key={minutes}
                        type="button"
                        size="sm"
                        variant={form.durationMinutes === minutes ? "default" : "outline"}
                        onClick={() => setForm((f) => ({ ...f, durationMinutes: minutes }))}
                      >
                        {formatDuration(minutes)}
                      </Button>
                    ))}
                  </div>
                  <div className="max-w-[200px]">
                    <Input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={form.durationMinutes ? form.durationMinutes / 60 : ""}
                      onChange={(event) => {
                        const hours = Number(event.target.value);
                        if (!Number.isFinite(hours)) {
                          setForm((f) => ({ ...f, durationMinutes: undefined }));
                          return;
                        }
                        setForm((f) => ({ ...f, durationMinutes: Math.max(30, Math.round(hours * 60)) }));
                      }}
                      placeholder="Hours (e.g., 4)"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.category === "addon"}
                      onCheckedChange={(checked) =>
                        setForm((f) => ({ ...f, category: checked ? "addon" : "core" }))
                      }
                    />
                    Mark as add-on service
                  </label>
                </div>
                <div className="space-y-2">
                  <Label>Template</Label>
                  <Select value={templateMode} onValueChange={(value) => setTemplateMode(value as "existing" | "new")}>
                    <SelectTrigger className="max-w-xs">
                      <SelectValue placeholder="Choose template option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="existing">Link existing template</SelectItem>
                      <SelectItem value="new">Create new template</SelectItem>
                    </SelectContent>
                  </Select>
                  {templateMode === "existing" ? (
                    <Select value={templateSelection} onValueChange={setTemplateSelection}>
                      <SelectTrigger className="max-w-xs">
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64 overflow-y-auto">
                        <SelectItem value="none">No template</SelectItem>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={templateName}
                      onChange={(event) => setTemplateName(event.target.value)}
                      placeholder="New template name"
                      className="max-w-xs"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input name="price" type="number" value={form.price || ""} onChange={handleChange} min={0} step="0.01" />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createService.isPending || updateService.isPending}>
                    {editingId ? "Save Changes" : "Add Service"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Inline form for creating/editing package */}
        {showPackageForm && (
          <Card className="my-4">
            <CardHeader>
              <CardTitle>{editingId ? "Edit Package" : "Create Package"}</CardTitle>
              <CardDescription>Bundle multiple services together with special pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Package Name</Label>
                  <Input name="name" value={form.name || ""} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea name="description" value={form.description || ""} onChange={handleChange} placeholder="Brief overview of the package" rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Included Services (select at least one)</Label>
                  <div className="grid grid-cols-2 gap-2 border rounded-md p-3">
                    {individualServices.map((service) => (
                      <label key={service.serviceId} className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedServiceIds.includes(service.serviceId)}
                          onCheckedChange={(checked) => handleServiceSelect(service.serviceId, checked as boolean)}
                        />
                        <span className="text-sm">
                          {service.name}
                          {service.price && <span className="text-muted-foreground ml-1">(${service.price.toFixed(2)})</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Total Duration</Label>
                  <Input value={`${form.durationMinutes || 0} minutes`} readOnly />
                </div>
                {selectedServiceIds.length > 0 && (
                  <div className="space-y-2">
                    <Label>Package Discount</Label>
                    <div className="flex flex-wrap gap-2">
                      {[0, 5, 10, 15, 20].map((percent) => (
                        <label
                          key={percent}
                          className={`flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer transition-colors ${
                            discountPercent === percent ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"
                          }`}
                        >
                          <input
                            type="radio"
                            name="discount"
                            value={percent}
                            checked={discountPercent === percent}
                            onChange={() => handleDiscountChange(percent)}
                            className="sr-only"
                          />
                          <span className="text-sm font-medium">{percent === 0 ? "No Discount" : `${percent}% Off`}</span>
                        </label>
                      ))}
                    </div>
                    {discountPercent > 0 && selectedServiceIds.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Price will be auto-calculated: $
                        {Math.ceil(
                          (selectedServiceIds.reduce((sum, id) => {
                            const service = allServices.find((s) => s.serviceId === id);
                            return sum + (service?.price || 0);
                          }, 0) *
                            (1 - discountPercent / 100)) /
                            5
                        ) * 5}
                      </p>
                    )}
                  </div>
                )}
                <IncludesEditor includes={form.includes || []} onChange={(includes) => setForm((f) => ({ ...f, includes }))} />
                <div className="space-y-2">
                  <Label>
                    Package Price ($) {discountPercent > 0 && <span className="text-muted-foreground font-normal">(auto-calculated, editable)</span>}
                  </Label>
                  <Input name="price" type="number" value={form.price || ""} onChange={handleChange} min={0} step="1" required />
                  <p className="text-xs text-muted-foreground">Total duration: {formatDuration(form.durationMinutes)}</p>
                  {selectedServiceIds.length > 0 && form.price && (
                    <div className="text-sm space-y-1 mt-2 p-3 bg-muted/50 rounded-md">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Individual services total:</span>
                        <span className="font-medium">${getPackageDiscount(selectedServiceIds).totalIndividualPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Package price:</span>
                        <span className="font-medium">${getPackageDiscount(selectedServiceIds).packagePrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        {(() => {
                          const discount = getPackageDiscount(selectedServiceIds);
                          return (
                            <>
                              <span className={discount.discount > 0 ? "text-green-600 font-medium" : "text-muted-foreground"}>
                                {discount.discount > 0 ? "Savings:" : "No discount"}
                              </span>
                              {discount.discount > 0 && (
                                <span className="text-green-600 font-medium">
                                  ${discount.discount.toFixed(2)} ({discount.discountPercent}% off)
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createService.isPending || updateService.isPending || selectedServiceIds.length === 0}>
                    {editingId ? "Save Changes" : "Add Package"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Services/Packages Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Services & Packages</CardTitle>
            <CardDescription>
              {isLoading
                ? "Loading..."
                : `${allServices.length} total (${individualServices.length} services, ${allServices.length - individualServices.length} packages)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allServices.length === 0 && !isLoading ? (
              <div className="rounded-lg border border-dashed p-10 text-center">
                <h3 className="text-lg font-semibold">No services yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create your first service to start building packages.
                </p>
                {can(userRole, "manage_billing") && (
                  <Button className="mt-4" onClick={() => setShowServiceForm(true)}>
                    Create service
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
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No services found.
                    </div>
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
                              {formatDuration(service.durationMinutes)}
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
                  <div className="mb-4 flex flex-wrap gap-2">
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
                        cell: ({ row }) =>
                          formatDuration(row.original.durationMinutes),
                      },
                      {
                        id: "actions",
                        header: "Actions",
                        cell: ({ row }) => (
                          can(userRole, "manage_billing") ? (
                            <Button variant="destructive" size="sm" onClick={() => handleArchive(row.original.serviceId)}>
                              Archive
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">No access</span>
                          )
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
      </div>
    </AdminShell>
  );
}
