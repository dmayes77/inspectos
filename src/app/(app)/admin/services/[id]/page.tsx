"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useServices, useUpdateService, useDeleteService, Service } from "@/hooks/use-services";
import { AppShell } from "@/components/layout/app-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { IncludesEditor } from "@/components/ui/includes-editor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, Edit, Trash2, DollarSign, Package, Check } from "lucide-react";
import { toast } from "sonner";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { calculatePackageDiscount } from "@/lib/utils/pricing";

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: allServices = [] } = useServices();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const service = allServices.find((s) => s.serviceId === params.id);
  const [form, setForm] = useState<Partial<Service>>({});
  const [editing, setEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const individualServices = allServices.filter((s) => !s.isPackage);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Sync form state when service changes
  useEffect(() => {
    if (service) {
      setForm(service);
      setSelectedServiceIds(service.includedServiceIds || []);
    }
  }, [service]);

  if (!service) {
    return (
      <AppShell user={mockAdminUser}>
        <div className="space-y-6">
          <Button variant="ghost" asChild>
            <Link href="/admin/services">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Services
            </Link>
          </Button>
          <div className="text-center py-12">
            <h1 className="text-2xl font-semibold mb-2">Service Not Found</h1>
            <p className="text-muted-foreground">The service you&apos;re looking for doesn&apos;t exist.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleServiceSelect = (id: string, checked: boolean) => {
    const updatedIds = checked
      ? [...selectedServiceIds, id]
      : selectedServiceIds.filter((sid) => sid !== id);

    setSelectedServiceIds(updatedIds);

    // Auto-combine includes from all selected services
    if (service.isPackage) {
      const combinedIncludes = updatedIds.flatMap((serviceId) => {
        const svc = allServices.find((s) => s.serviceId === serviceId);
        return svc?.includes || [];
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
      const svc = allServices.find((s) => s.serviceId === id);
      return sum + (svc?.price || 0);
    }, 0);

    const discountedPrice = totalIndividualPrice * (1 - percent / 100);
    // Round up to nearest 5 (e.g., $697.50 → $700, $692.34 → $695)
    const roundedPrice = Math.ceil(discountedPrice / 5) * 5;
    setForm((f) => ({ ...f, price: roundedPrice }));
  };

  const getPackageDiscount = () => {
    if (!service.isPackage || selectedServiceIds.length === 0) {
      return { totalIndividualPrice: 0, packagePrice: 0, discount: 0, discountPercent: 0 };
    }
    
    const includedServices = selectedServiceIds
      .map((id) => allServices.find((s) => s.serviceId === id))
      .filter((s): s is NonNullable<typeof s> => s !== undefined);
    
    const packageService = {
      serviceId: service.serviceId,
      name: service.name,
      price: parseFloat(String(form.price)) || 0,
      isPackage: true,
      includedServiceIds: selectedServiceIds,
    };
    
    return calculatePackageDiscount(packageService, includedServices);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: packages must have services
    if (service.isPackage) {
      if (selectedServiceIds.length === 0) {
        toast.error("Packages must include at least one service");
        return;
      }
      form.includedServiceIds = selectedServiceIds;
    }

    updateService.mutate(
      { serviceId: service.serviceId, ...form },
      {
        onSuccess: () => {
          toast.success("Service updated successfully");
          setEditing(false);
          setDiscountPercent(0);
        },
        onError: (error: unknown) => {
          const message = error instanceof Error ? error.message : "Failed to update service";
          toast.error(message);
        },
      }
    );
  };

  const handleDelete = () => {
    deleteService.mutate(service.serviceId, {
      onSuccess: () => {
        toast.success("Service deleted successfully");
        setDeleteDialogOpen(false);
        router.push("/admin/services");
      },
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : "Failed to delete service";
        toast.error(message);
        setDeleteDialogOpen(false);
      },
    });
  };

  return (
    <AppShell user={mockAdminUser}>
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" asChild>
          <Link href="/admin/services">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Services & Packages
          </Link>
        </Button>

        <AdminPageHeader
          title={
            <span className="flex items-center gap-2">
              {service.name}
              {service.isPackage ? (
                <Badge variant="secondary">
                  <Package className="mr-1 h-3 w-3" />
                  Package
                </Badge>
              ) : null}
            </span>
          }
          actions={
            <div className="flex flex-wrap gap-2 sm:flex-nowrap">
              <Button variant="outline" onClick={() => { setEditing(true); setDiscountPercent(0); }}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          }
        />

        {/* Details Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-sm">{service.description || "No description provided."}</div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Price</span>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium text-lg">{service.price ? `$${service.price.toFixed(2)}` : "N/A"}</span>
                </div>
              </div>
              {service.isPackage && service.includedServiceIds && service.includedServiceIds.length > 0 && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Individual total:</span>
                    <span>
                      $
                      {service.includedServiceIds
                        .reduce((sum, id) => {
                          const svc = allServices.find((s) => s.serviceId === id);
                          return sum + (svc?.price || 0);
                        }, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                  {service.price && (
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <span className="text-green-600 font-medium">Savings:</span>
                      <span className="text-green-600 font-medium">
                        $
                        {(
                          service.includedServiceIds.reduce((sum, id) => {
                            const svc = allServices.find((s) => s.serviceId === id);
                            return sum + (svc?.price || 0);
                          }, 0) - service.price
                        ).toFixed(2)}{" "}
                        (
                        {(
                          ((service.includedServiceIds.reduce((sum, id) => {
                            const svc = allServices.find((s) => s.serviceId === id);
                            return sum + (svc?.price || 0);
                          }, 0) -
                            service.price) /
                            service.includedServiceIds.reduce((sum, id) => {
                              const svc = allServices.find((s) => s.serviceId === id);
                              return sum + (svc?.price || 0);
                            }, 0)) *
                          100
                        ).toFixed(0)}
                        % off)
                      </span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* What's Included */}
          {service.includes && service.includes.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>What&apos;s Included</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 md:grid-cols-2">
                  {service.includes.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Included Services (for packages) */}
          {service.isPackage && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Included Services</CardTitle>
              </CardHeader>
              <CardContent>
                {service.includedServiceIds && service.includedServiceIds.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {service.includedServiceIds.map((sid) => {
                      const svc = allServices.find((s) => s.serviceId === sid);
                      return svc ? (
                        <Badge key={sid} variant="outline" className="text-base">
                          {svc.name}
                          {svc.price && <span className="ml-1 text-muted-foreground">${svc.price.toFixed(2)}</span>}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">No services included.</div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit Form */}
        {editing && (
          <Card className="my-4">
            <CardHeader>
              <CardTitle>Edit {service.isPackage ? "Package" : "Service"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input name="name" value={form.name || ""} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    name="description"
                    value={form.description || ""}
                    onChange={handleChange}
                    placeholder="Brief overview"
                    rows={2}
                  />
                </div>
                {!service.isPackage && (
                  <>
                    <IncludesEditor
                      includes={form.includes || []}
                      onChange={(includes) => setForm((f) => ({ ...f, includes }))}
                    />
                    <div className="space-y-2">
                      <Label>Price ($)</Label>
                      <Input name="price" type="number" value={form.price || ""} onChange={handleChange} min={0} step="0.01" />
                    </div>
                  </>
                )}
                {service.isPackage && (
                  <>
                    <div className="space-y-2">
                      <Label>Included Services</Label>
                      <div className="grid grid-cols-2 gap-2 border rounded-md p-3">
                        {individualServices.map((svc) => (
                          <label key={svc.serviceId} className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedServiceIds.includes(svc.serviceId)}
                              onCheckedChange={(checked) => handleServiceSelect(svc.serviceId, checked as boolean)}
                            />
                            <span className="text-sm">
                              {svc.name}
                              {svc.price && <span className="text-muted-foreground ml-1">(${svc.price.toFixed(2)})</span>}
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
                                discountPercent === percent
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background hover:bg-accent"
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
                                const svc = allServices.find((s) => s.serviceId === id);
                                return sum + (svc?.price || 0);
                              }, 0) *
                                (1 - discountPercent / 100)) /
                                5
                            ) * 5}
                          </p>
                        )}
                      </div>
                    )}
                    <IncludesEditor
                      includes={form.includes || []}
                      onChange={(includes) => setForm((f) => ({ ...f, includes }))}
                    />
                    <div className="space-y-2">
                      <Label>Package Price ($) {discountPercent > 0 && <span className="text-muted-foreground font-normal">(auto-calculated, editable)</span>}</Label>
                      <Input name="price" type="number" value={form.price || ""} onChange={handleChange} min={0} step="1" />
                    </div>
                    {selectedServiceIds.length > 0 && form.price && (() => {
                      const discount = getPackageDiscount();
                      return (
                        <div className="text-sm space-y-1 p-3 bg-muted/50 rounded-md">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Individual services total:</span>
                            <span className="font-medium">${discount.totalIndividualPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Package price:</span>
                            <span className="font-medium">${discount.packagePrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t">
                            <span className={discount.discount > 0 ? "text-green-600 font-medium" : "text-muted-foreground"}>
                              {discount.discount > 0 ? "Savings:" : "No discount"}
                            </span>
                            {discount.discount > 0 && (
                              <span className="text-green-600 font-medium">
                                ${discount.discount.toFixed(2)} ({discount.discountPercent}% off)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div className="flex gap-2">
                  <Button type="submit" disabled={updateService.isPending}>
                    Save Changes
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setEditing(false); setDiscountPercent(0); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {service.isPackage ? "Package" : "Service"}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <span className="font-semibold">{service.name}</span> and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppShell>
  );
}
