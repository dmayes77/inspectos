"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import { Check, Loader2, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

import { useServices, useDeleteService } from "@/hooks/use-services";
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
  const { data: templatesData = [] } = useTemplates();
  const { data: profile } = useProfile();
  const currentTemplate = templatesData.find((template) => template.id === service?.templateId);
  const userRole = (profile?.role ?? "").toUpperCase();
  const userPermissions = profile?.permissions ?? [];

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const individualTotal = useMemo(() => {
    if (!service?.includedServiceIds?.length) return 0;
    return service.includedServiceIds.reduce((sum, id) => {
      const svc = allServices.find((s) => s.serviceId === id);
      return sum + (svc?.price || 0);
    }, 0);
  }, [service?.includedServiceIds, allServices]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !service) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Service Not Found"
          description={error instanceof Error ? error.message : "This service is no longer available."}
        />
      </div>
    );
  }

  const handleDelete = async () => {
    if (!service) return;
    setIsDeleting(true);
    try {
      await deleteService.mutateAsync(service.serviceId);
      toast.success("Service deleted");
      router.push("/admin/services");
    } catch (error) {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      const message = error instanceof Error ? error.message : "Failed to delete service";
      toast.error(message);
    }
  };

  return (
    <>
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            {service.name}
            {service.isPackage && (
              <Badge color="light" className="text-xs">
                Package
              </Badge>
            )}
          </span>
        }
        description={service.description || "No description provided."}
        actions={
          can(userRole, "manage_billing", userPermissions) ? (
            <div className="flex flex-wrap gap-2 sm:flex-nowrap">
              <Button asChild variant="outline">
                <Link href={`/admin/services/${service.serviceId}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          ) : null
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{service.description || "No description"}</p>
            <Separator className="my-4" />
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>
                Status: <span className="text-foreground capitalize">{service.status || "active"}</span>
              </span>
              <span>
                Category: <span className="text-foreground capitalize">{service.category || "core"}</span>
              </span>
            </div>
          </CardContent>
        </Card>

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
              <div className="flex items-center justify-between">
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
      </div>

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
    </div>
    </>
  );
}
