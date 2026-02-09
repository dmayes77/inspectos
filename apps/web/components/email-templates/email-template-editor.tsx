"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateEmailTemplate, useEmailTemplates, useUpdateEmailTemplate } from "@/hooks/use-email-templates";
import type { EmailTemplate } from "@/types/email-template";
import { mockAdminUser } from "@inspectos/shared/constants/mock-users";
import { toast } from "sonner";

export function EmailTemplateEditor() {
  const params = useParams();
  const router = useRouter();
  const templateId = typeof params.id === "string" ? params.id : null;
  const isNew = !templateId;

  const { data: templates = [] } = useEmailTemplates();
  const createTemplate = useCreateEmailTemplate();
  const updateTemplate = useUpdateEmailTemplate();

  const existing = useMemo(() => templates.find((template) => template.id === templateId) ?? null, [templates, templateId]);

  const [form, setForm] = useState<Partial<EmailTemplate>>({
    name: existing?.name ?? "",
    subject: existing?.subject ?? "",
    body: existing?.body ?? "",
    category: existing?.category ?? "",
    description: existing?.description ?? "",
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name?.trim() || !form.subject?.trim() || !form.body?.trim()) {
      toast.error("Name, subject, and body are required.");
      return;
    }

    if (!isNew && existing) {
      updateTemplate.mutate(
        { id: existing.id, ...form },
        {
          onSuccess: () => {
            toast.success("Email template updated.");
            router.push("/admin/email-templates");
          },
          onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to update template.");
          },
        }
      );
      return;
    }

    createTemplate.mutate(form, {
      onSuccess: () => {
        toast.success("Email template created.");
        router.push("/admin/email-templates");
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to create template.");
      },
    });
  };

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <BackButton
          href="/admin/email-templates"
          label="Back to Email Templates"
          variant="ghost"
        />

        <AdminPageHeader
          title={isNew ? "New Email Template" : "Edit Email Template"}
          description="Compose and manage reusable email templates."
          actions={<Button onClick={handleSubmit}>{isNew ? "Create Template" : "Save Changes"}</Button>}
        />

        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={form.subject ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={form.category ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="lead, inspection, invoice..."
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea value={form.body ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))} rows={10} />
              </div>
              <Button type="submit" className="w-full">
                {isNew ? "Create Template" : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
