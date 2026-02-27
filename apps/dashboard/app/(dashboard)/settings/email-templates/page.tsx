"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Mail, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEmailTemplates, useDeleteEmailTemplate } from "@/hooks/use-email-templates";
import type { EmailTemplate } from "@/types/email-template";
import { toSlugIdSegment } from "@/lib/routing/slug-id";

export default function EmailTemplatesPage() {
  const { data: templates = [] } = useEmailTemplates();
  const deleteTemplate = useDeleteEmailTemplate();
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

  const handleDeleteTemplate = () => {
    if (!deleteTemplateId) return;
    deleteTemplate.mutate(deleteTemplateId, {
      onSuccess: () => {
        toast.success("Template deleted.");
        setDeleteTemplateId(null);
      },
      onError: (error) =>
        toast.error(error instanceof Error ? error.message : "Failed to delete template."),
    });
  };

  return (
    <>
    <div className="space-y-6">
      <AdminPageHeader
        title="Email Templates"
        description="Create reusable email templates for workflows"
        actions={
          <Button asChild>
            <Link href="/email-templates/new">
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {templates.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              No templates yet. Create your first template.
            </div>
          ) : (
            templates.map((template: EmailTemplate) => (
              <div key={template.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{template.name}</span>
                      {template.isSystem ? <Badge color="light">System</Badge> : null}
                    </div>
                    <p className="text-sm text-muted-foreground">{template.subject}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" asChild>
                    <Link href={`/email-templates/${toSlugIdSegment(template.name, template.id)}`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  {!template.isSystem ? (
                    <Button variant="ghost" onClick={() => setDeleteTemplateId(template.id)}>
                      <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                      Delete
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
    <AlertDialog open={Boolean(deleteTemplateId)} onOpenChange={(open) => (!open ? setDeleteTemplateId(null) : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete template?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this template? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteTemplate.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteTemplate}
            disabled={deleteTemplate.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteTemplate.isPending ? "Deleting..." : "Delete Anyway"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
