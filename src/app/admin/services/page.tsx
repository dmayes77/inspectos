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
import { Plus } from "lucide-react";
import { toast } from "sonner";

const mockUser = {
  name: "Sarah Johnson",
  email: "sarah@acmeinspections.com",
  companyName: "Acme Home Inspections",
};

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
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

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
      setForm((f) => ({ ...f, includes: uniqueIncludes }));
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

  const calculatePackageDiscount = (includedIds: string[]) => {
    const totalIndividualPrice = includedIds.reduce((sum, id) => {
      const service = allServices.find((s) => s.serviceId === id);
      return sum + (service?.price || 0);
    }, 0);
    const packagePrice = parseFloat(String(form.price)) || 0;
    const discount = totalIndividualPrice - packagePrice;
    return { totalIndividualPrice, packagePrice, discount };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: packages must have services
    if (form.isPackage) {
      if (selectedServiceIds.length === 0) {
        toast.error("Packages must include at least one service");
        return;
      }
      form.includedServiceIds = selectedServiceIds;
    }

    if (editingId) {
      updateService.mutate(
        { serviceId: editingId, ...form },
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
      createService.mutate(form, {
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
    <AdminShell user={mockUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Services & Packages"
          description="Define individual services and create bundled packages"
          actions={
            <div className="flex flex-wrap gap-2 sm:flex-nowrap">
              <Button
                onClick={() => {
                  setShowServiceForm(true);
                  setShowPackageForm(false);
                  setForm({ isPackage: false });
                  setEditingId(null);
                  setDiscountPercent(0);
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
                  {selectedServiceIds.length > 0 && form.price && (
                    <div className="text-sm space-y-1 mt-2 p-3 bg-muted/50 rounded-md">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Individual services total:</span>
                        <span className="font-medium">${calculatePackageDiscount(selectedServiceIds).totalIndividualPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Package price:</span>
                        <span className="font-medium">${calculatePackageDiscount(selectedServiceIds).packagePrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className={calculatePackageDiscount(selectedServiceIds).discount > 0 ? "text-green-600 font-medium" : "text-muted-foreground"}>
                          {calculatePackageDiscount(selectedServiceIds).discount > 0 ? "Savings:" : "No discount"}
                        </span>
                        {calculatePackageDiscount(selectedServiceIds).discount > 0 && (
                          <span className="text-green-600 font-medium">
                            ${calculatePackageDiscount(selectedServiceIds).discount.toFixed(2)} (
                            {(
                              (calculatePackageDiscount(selectedServiceIds).discount / calculatePackageDiscount(selectedServiceIds).totalIndividualPrice) *
                              100
                            ).toFixed(0)}
                            % off)
                          </span>
                        )}
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
                  id: "actions",
                  header: "Actions",
                  cell: ({ row }) => (
                    <Button variant="destructive" size="sm" onClick={() => handleArchive(row.original.serviceId)}>
                      Archive
                    </Button>
                  ),
                },
              ]}
              data={allServices}
              searchKey="name"
              searchPlaceholder="Search services and packages..."
            />
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
