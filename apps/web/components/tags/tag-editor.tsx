"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTag, useTags, useUpdateTag } from "@/hooks/use-tags";
import type { Tag, TagScope, TagType } from "@/types/tag";
import { toast } from "sonner";

const scopeOptions: { value: TagScope; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "client", label: "Client" },
  { value: "inspection", label: "Inspection" },
  { value: "invoice", label: "Invoice" },
  { value: "job", label: "Job" },
  { value: "payment", label: "Payment" },
  { value: "service", label: "Service" },
  { value: "template", label: "Template" },
];

const typeOptions: { value: TagType; label: string }[] = [
  { value: "stage", label: "Stage" },
  { value: "status", label: "Status" },
  { value: "segment", label: "Segment" },
  { value: "source", label: "Source" },
  { value: "priority", label: "Priority" },
  { value: "custom", label: "Custom" },
];

export function TagEditor() {
  const params = useParams();
  const router = useRouter();
  const tagId = typeof params.id === "string" ? params.id : null;
  const isNew = !tagId;

  const { data: tags = [] } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();

  const existing = useMemo(() => tags.find((tag) => tag.id === tagId) ?? null, [tags, tagId]);

  const [form, setForm] = useState<Partial<Tag>>({
    name: existing?.name ?? "",
    scope: existing?.scope ?? "lead",
    tagType: existing?.tagType ?? "stage",
    description: existing?.description ?? "",
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name?.trim()) {
      toast.error("Tag name is required.");
      return;
    }
    if (!form.scope) {
      toast.error("Select a scope.");
      return;
    }

    if (!isNew && existing) {
      updateTag.mutate(
        { id: existing.id, ...form },
        {
          onSuccess: () => {
            toast.success("Tag updated.");
            router.push("/app/tags");
          },
          onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to update tag.");
          },
        }
      );
      return;
    }

    createTag.mutate(form, {
      onSuccess: () => {
        toast.success("Tag created.");
        router.push("/app/tags");
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to create tag.");
      },
    });
  };

  return (
    <div className="space-y-6">

        <AdminPageHeader
          title={isNew ? "New Tag" : "Edit Tag"}
          description="Scoped tags drive status and workflow automation."
          actions={<Button onClick={handleSubmit}>{isNew ? "Create Tag" : "Save Changes"}</Button>}
        />

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Tag Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Scope</Label>
                <Select
                  value={(form.scope ?? "lead") as TagScope}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, scope: value as TagScope }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scopeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={(form.tagType ?? "stage") as TagType}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, tagType: value as TagType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full">
                {isNew ? "Create Tag" : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
    </div>
  );
}
