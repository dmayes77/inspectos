"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { IdPageLayout } from "@/components/shared/id-page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Check, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useServices, useDeleteService, useUpdateService } from "@/hooks/use-services";
import { useTemplates } from "@/hooks/use-templates";
import { useProfile } from "@/hooks/use-profile";
import { can } from "@/lib/admin/permissions";
import { TagAssignmentEditor } from "@/components/tags/tag-assignment-editor";

const formatDuration = (minutes?: number) => {
  if (!minutes) return "—";
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
};

export default function ServiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id;

  const { data: allServices = [], isLoading, isError, error } = useServices();
  const service = allServices.find((svc) => svc.serviceId === serviceId);
  const deleteService = useDeleteService();
  const updateService = useUpdateService();
  const { data: templatesData = [] } = useTemplates();
  const { data: profile } = useProfile();
  const currentTemplate = templatesData.find((template) => template.id === service?.templateId);
  const userRole = (profile?.role ?? "").toUpperCase();
  const userPermissions = profile?.permissions ?? [];
  const canManageServiceCatalog =
    can(userRole, "manage_billing", userPermissions) || can(userRole, "edit_templates", userPermissions);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("none");
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    durationMinutes: "",
    category: "core" as "core" | "addon",
    status: "active" as "active" | "inactive",
  });

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const individualTotal = useMemo(() => {
    if (!service?.includedServiceIds?.length) return 0;
    return service.includedServiceIds.reduce((sum, id) => {
      const svc = allServices.find((s) => s.serviceId === id);
      return sum + (svc?.price || 0);
    }, 0);
  }, [service?.includedServiceIds, allServices]);

  useEffect(() => {
    setSelectedTemplateId(service?.templateId ?? "none");
  }, [service?.serviceId, service?.templateId]);

  useEffect(() => {
    if (!service) return;
    setEditForm({
      name: service.name ?? "",
      description: service.description ?? "",
      price: service.price != null ? String(service.price) : "",
      durationMinutes: service.durationMinutes != null ? String(service.durationMinutes) : "",
      category: service.category ?? "core",
      status: service.status ?? "active",
    });
  }, [service?.serviceId, service?.name, service?.description, service?.price, service?.durationMinutes, service?.category, service?.status]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !service) {
    return (
      <IdPageLayout
        title="Service Not Found"
        description={error instanceof Error ? error.message : "This service is no longer available."}
      />
    );
  }

  const handleDelete = async () => {
    if (!service) return;
    setIsDeleting(true);
    try {
      await deleteService.mutateAsync(service.serviceId);
      toast.success("Service deleted");
      router.push("/services");
    } catch (error) {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      const message = error instanceof Error ? error.message : "Failed to delete service";
      toast.error(message);
    }
  };

  const handleSaveInlineEdits = async () => {
    if (!service) return;
    const parsedPrice = Number.parseFloat(editForm.price || "0");
    const parsedDuration = Number.parseInt(editForm.durationMinutes || "0", 10);

    if (!editForm.name.trim()) {
      toast.error("Service name is required.");
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      toast.error("Price must be a valid number.");
      return;
    }

    try {
      await updateService.mutateAsync({
        serviceId: service.serviceId,
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        price: parsedPrice,
        durationMinutes: Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : undefined,
        category: service.isPackage ? undefined : editForm.category,
        status: editForm.status,
        templateId: service.isPackage ? null : selectedTemplateId === "none" ? null : selectedTemplateId,
      });
      toast.success("Service updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update service.");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await handleSaveInlineEdits();
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <IdPageLayout
          title={service.name}
          description={service.description || "No description provided."}
          breadcrumb={
            <>
              <Link href="/services" className="text-muted-foreground transition hover:text-foreground">
                Services
              </Link>
              <span className="text-muted-foreground">{">"}</span>
              <span className="max-w-[20rem] truncate font-medium">{service.name}</span>
            </>
          }
          left={
            <div className="space-y-4">
              {canManageServiceCatalog ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Service Details</CardTitle>
                    <CardDescription>Edit this service inline.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="service-name">Name</Label>
                        <Input
                          id="service-name"
                          value={editForm.name}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="service-price">Price</Label>
                        <Input
                          id="service-price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={editForm.price}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, price: event.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="service-duration">Duration (minutes)</Label>
                        <Input
                          id="service-duration"
                          type="number"
                          min="0"
                          value={editForm.durationMinutes}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, durationMinutes: event.target.value }))}
                        />
                      </div>
                      {!service.isPackage ? (
                        <div className="space-y-1.5">
                          <Label htmlFor="service-category">Category</Label>
                          <Select
                            value={editForm.category}
                            onValueChange={(value) => setEditForm((prev) => ({ ...prev, category: value as "core" | "addon" }))}
                          >
                            <SelectTrigger id="service-category">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="core">Core</SelectItem>
                              <SelectItem value="addon">Add-on</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : null}
                      <div className="space-y-1.5">
                        <Label htmlFor="service-status">Status</Label>
                        <Select
                          value={editForm.status}
                          onValueChange={(value) => setEditForm((prev) => ({ ...prev, status: value as "active" | "inactive" }))}
                        >
                          <SelectTrigger id="service-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="service-description">Description</Label>
                      <Textarea
                        id="service-description"
                        rows={4}
                        value={editForm.description}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))}
                      />
                    </div>
                    {!service.isPackage ? (
                      <div className="space-y-1.5">
                        <Label htmlFor="service-template-edit">Inspection Template</Label>
                        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                          <SelectTrigger id="service-template-edit">
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No template</SelectItem>
                            {templatesData
                              .filter((template) => template.type === "inspection")
                              .map((template) => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}

              {service.includes && service.includes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>What&apos;s Included</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid gap-2">
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

              {service.isPackage && (
                <Card>
                  <CardHeader>
                    <CardTitle>Included Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {service.includedServiceIds && service.includedServiceIds.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {service.includedServiceIds.map((sid) => {
                          const svc = allServices.find((s) => s.serviceId === sid);
                          return svc ? (
                            <Badge key={sid} color="light" className="text-sm">
                              {svc.name}
                              {svc.price && <span className="ml-1 text-muted-foreground">${svc.price.toFixed(2)}</span>}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No services included yet.</p>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Price</div>
                    <div className="font-medium text-lg">{service.price ? `$${service.price.toFixed(2)}` : "N/A"}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Duration</div>
                    <div className="font-medium">{formatDuration(service.durationMinutes)}</div>
                  </div>
                  {!service.isPackage && (
                    <div className="space-y-2 border-t pt-3">
                      <div className="text-sm text-muted-foreground">Template</div>
                      <div className="font-medium">{currentTemplate?.name || "—"}</div>
                    </div>
                  )}
                  {service.isPackage && service.includedServiceIds?.length ? (
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Individual total</span>
                        <span className="font-medium">${individualTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Package price</span>
                        <span className="font-medium">${service.price?.toFixed(2) ?? 0}</span>
                      </div>
                      {service.price && individualTotal > (service.price || 0) && (
                        <div className="flex items-center justify-between text-green-600 font-medium text-sm">
                          <span>Savings</span>
                          <span>${(individualTotal - (service.price || 0)).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <TagAssignmentEditor scope="service" entityId={service.serviceId} />
                </CardContent>
              </Card>
            </div>
          }
          right={
            <>
              {canManageServiceCatalog ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button className="w-full" type="submit" disabled={updateService.isPending}>
                      {updateService.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button className="w-full" variant="outline" type="button" onClick={() => router.push("/services")} disabled={updateService.isPending || isDeleting}>
                      Back to Services
                    </Button>
                    <Button className="w-full" variant="destructive" type="button" onClick={() => setShowDeleteDialog(true)} disabled={isDeleting}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Service
                    </Button>
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle>Quick Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Use service defaults for repeatable order setup.</p>
                  <p>Set a template for standard inspection workflows.</p>
                  <p>Keep pricing and duration updated for scheduler accuracy.</p>
                </CardContent>
              </Card>
            </>
          }
        />
      </form>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {service.isPackage ? "Package" : "Service"}?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            This will permanently delete {service.name} and cannot be undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white"
              disabled={isDeleting}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
