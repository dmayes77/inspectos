"use client";

import Link from "next/link";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEmailTemplates, useDeleteEmailTemplate } from "@/hooks/use-email-templates";
import type { EmailTemplate } from "@/types/email-template";

export default function EmailTemplatesPage() {
  const { data: templates = [] } = useEmailTemplates();
  const deleteTemplate = useDeleteEmailTemplate();

  return (
    <>
    <div className="space-y-6">
      <AdminPageHeader
        title="Email Templates"
        description="Create reusable email templates for workflows"
        actions={
          <Button asChild>
            <Link href="/app/email-templates/new">
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
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No templates yet. Create your first template.
            </div>
          ) : (
            templates.map((template: EmailTemplate) => (
              <div key={template.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
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
                    <Link href={`/app/email-templates/${template.id}`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  {!template.isSystem ? (
                    <Button
                     
                      variant="ghost"
                      onClick={() =>
                        deleteTemplate.mutate(template.id, {
                          onSuccess: () => toast.success("Template deleted."),
                          onError: (error) =>
                            toast.error(error instanceof Error ? error.message : "Failed to delete template."),
                        })
                      }
                    >
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
    </>
  );
}
