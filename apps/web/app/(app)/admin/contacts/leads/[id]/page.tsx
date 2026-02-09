"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Edit, Trash2, Mail, Phone, ClipboardList } from "lucide-react";
import { TagAssignmentEditor } from "@/components/tags/tag-assignment-editor";
import { useDeleteLead, useLeadById, useUpdateLead } from "@/hooks/use-leads";
import { mockAdminUser } from "@inspectos/shared/constants/mock-users";
import { toast } from "sonner";
import { ResourceFormLayout } from "@/components/shared/resource-form-layout";
import {
  LeadFormErrors,
  LeadFormSections,
  LeadFormValues,
  createEmptyLeadForm,
  validateLeadForm,
} from "@/components/leads/lead-form-sections";

function LeadDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("return") || "/admin/contacts?tab=leads";

  const { data: lead, isLoading } = useLeadById(id);
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const [editing, setEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [form, setForm] = useState<LeadFormValues>(createEmptyLeadForm());
  const [errors, setErrors] = useState<LeadFormErrors>({});

  useEffect(() => {
    if (!lead) return;
    setForm({
      name: lead.name ?? "",
      email: lead.email ?? "",
      phone: lead.phone ?? "",
      stage: lead.stage ?? "new",
      serviceName: lead.serviceName ?? "",
      requestedDate: lead.requestedDate ?? "",
      estimatedValue: lead.estimatedValue?.toString() ?? "",
      source: lead.source ?? "",
    });
  }, [lead]);

  if (isLoading) {
    return (
      <AdminShell user={mockAdminUser}>
        <div className="py-12 text-center text-muted-foreground">Loading lead...</div>
      </AdminShell>
    );
  }

  if (!lead) {
    return (
      <AdminShell user={mockAdminUser}>
        <PageHeader
          breadcrumb={
            <>
              <Link href="/admin/overview" className="hover:text-foreground">
                Overview
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href="/admin/contacts" className="hover:text-foreground">
                Contacts
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href="/admin/leads" className="hover:text-foreground">
                Leads
              </Link>
            </>
          }
          title="Lead Not Found"
          description="The lead you're looking for doesn't exist or you don't have access."
          backHref={returnTo}
        />
      </AdminShell>
    );
  }

  const handleSave = async () => {
    try {
      const validationErrors = validateLeadForm(form);
      setErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) {
        return;
      }
      await updateLead.mutateAsync({
        leadId: lead.leadId,
        name: form.name,
        email: form.email,
        phone: form.phone,
        stage: form.stage,
        serviceName: form.serviceName,
        requestedDate: form.requestedDate,
        estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : 0,
        source: form.source,
      });
      toast.success("Lead updated.");
      setEditing(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update lead.");
    }
  };

  const handleDelete = () => {
    deleteLead.mutate(lead.leadId, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        router.push("/admin/leads");
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to delete lead.");
      },
    });
  };

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <PageHeader
          breadcrumb={
            <>
              <Link href="/admin/overview" className="hover:text-foreground">
                Overview
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href="/admin/contacts" className="hover:text-foreground">
                Contacts
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href="/admin/leads" className="hover:text-foreground">
                Leads
              </Link>
              <span className="text-muted-foreground">/</span>
              <span>{lead.name}</span>
            </>
          }
          title={lead.name}
          description="Lead details and status"
          backHref={returnTo}
          actions={
            <>
              <Button variant="outline" onClick={() => setEditing((prev) => !prev)}>
                <Edit className="mr-2 h-4 w-4" />
                {editing ? "Cancel" : "Edit"}
              </Button>
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>Lead Overview</CardTitle>
            <CardDescription>Contact and opportunity details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{lead.email || "No email"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{lead.phone || "No phone"}</span>
              </div>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{lead.serviceName || "No service selected"}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Estimated value: ${lead.estimatedValue?.toLocaleString() || 0}
              </div>
            </div>
          </CardContent>
        </Card>

        <ResourceFormLayout
          left={
            <LeadFormSections
              form={form}
              setForm={setForm}
              errors={errors}
              setErrors={setErrors}
              disabled={!editing}
              title="Lead Details"
              description="Update lead details and stage."
            />
          }
          right={
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" onClick={handleSave} disabled={!editing}>
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setEditing(false)}
                    disabled={!editing}
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>• Update the stage as the lead progresses</p>
                  <p>• Record service details for faster scheduling</p>
                  <p>• Capture sources to track lead quality</p>
                </CardContent>
              </Card>
            </>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <TagAssignmentEditor scope="lead" entityId={lead.leadId} />
          </CardContent>
        </Card>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Lead</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminShell>
  );
}

export default function LeadDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
      <LeadDetailPageContent />
    </Suspense>
  );
}
