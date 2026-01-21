"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { ChevronLeft, Edit, Trash2, Mail, Phone, ClipboardList } from "lucide-react";
import { TagAssignmentEditor } from "@/components/tags/tag-assignment-editor";
import { useDeleteLead, useLeadById, useUpdateLead, type Lead } from "@/hooks/use-leads";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { toast } from "sonner";

const stageOptions = [
  { value: "new", label: "New" },
  { value: "qualified", label: "Qualified" },
  { value: "quoted", label: "Quoted" },
  { value: "scheduled", label: "Scheduled" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

function LeadDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("return") || "/admin/clients?tab=leads";

  const { data: lead, isLoading } = useLeadById(id);
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const [editing, setEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [form, setForm] = useState<Partial<Lead>>({});
  const nameValue = form.name ?? lead?.name ?? "";
  const emailValue = form.email ?? lead?.email ?? "";
  const phoneValue = form.phone ?? lead?.phone ?? "";
  const stageValue = form.stage ?? lead?.stage ?? "new";
  const serviceValue = form.serviceName ?? lead?.serviceName ?? "";
  const requestedDateValue = form.requestedDate ?? lead?.requestedDate ?? "";
  const estimatedValueValue = form.estimatedValue ?? lead?.estimatedValue ?? 0;
  const sourceValue = form.source ?? lead?.source ?? "";

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
        <div className="space-y-6">
          <Button variant="ghost" asChild>
            <Link href={returnTo}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Leads
            </Link>
          </Button>
          <div className="text-center py-12">
            <h1 className="text-2xl font-semibold mb-2">Lead Not Found</h1>
            <p className="text-muted-foreground">The lead you are looking for does not exist.</p>
          </div>
        </div>
      </AdminShell>
    );
  }

  const handleSave = async () => {
    try {
      await updateLead.mutateAsync({
        leadId: lead.leadId,
        name: nameValue,
        email: emailValue,
        phone: phoneValue,
        stage: stageValue,
        serviceName: serviceValue,
        requestedDate: requestedDateValue,
        estimatedValue: estimatedValueValue,
        source: sourceValue,
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
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href={returnTo}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Leads
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing((prev) => !prev)}>
              <Edit className="mr-2 h-4 w-4" />
              {editing ? "Cancel" : "Edit"}
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

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

        <Card>
          <CardHeader>
            <CardTitle>Lead Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={nameValue}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                disabled={!editing}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={emailValue}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  disabled={!editing}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={phoneValue}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  disabled={!editing}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Stage</Label>
                <Select
                  value={stageValue}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, stage: value }))}
                  disabled={!editing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Service</Label>
                <Input
                  value={serviceValue}
                  onChange={(event) => setForm((prev) => ({ ...prev, serviceName: event.target.value }))}
                  disabled={!editing}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Requested date</Label>
                <Input
                  type="date"
                  value={requestedDateValue}
                  onChange={(event) => setForm((prev) => ({ ...prev, requestedDate: event.target.value }))}
                  disabled={!editing}
                />
              </div>
              <div className="space-y-2">
                <Label>Estimated value</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={estimatedValueValue}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, estimatedValue: Number(event.target.value) }))
                  }
                  disabled={!editing}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Input
                value={sourceValue}
                onChange={(event) => setForm((prev) => ({ ...prev, source: event.target.value }))}
                disabled={!editing}
              />
            </div>
            {editing ? (
              <div className="flex gap-2">
                <Button onClick={handleSave}>Save Changes</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

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
