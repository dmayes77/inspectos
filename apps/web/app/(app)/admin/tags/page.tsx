"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Tag as TagIcon, Pencil } from "lucide-react";
import { useDeleteTag, useTags } from "@/hooks/use-tags";
import type { TagScope } from "@/types/tag";
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

export default function TagsPage() {
  const { data: tags = [] } = useTags();
  const deleteTagMutation = useDeleteTag();

  const [scopeFilter, setScopeFilter] = useState<TagScope | "all">("all");

  const filteredTags = useMemo(() => {
    if (scopeFilter === "all") return tags;
    return tags.filter((tag) => tag.scope === scopeFilter);
  }, [tags, scopeFilter]);

  return (
    <>
    <div className="space-y-6">
      <AdminPageHeader
        title="Tags"
        description="Create and manage scoped tags for workflows and segmentation"
        actions={
          <Button asChild>
            <Link href="/admin/tags/new">
              <Plus className="mr-2 h-4 w-4" />
              New Tag
            </Link>
          </Button>
        }
      />

      <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Tags</CardTitle>
              <p className="text-sm text-muted-foreground">Tags are scoped to specific entities like leads or inspections.</p>
            </div>
            <div className="w-full sm:w-56">
              <Select value={scopeFilter} onValueChange={(value) => setScopeFilter(value as TagScope | "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All scopes</SelectItem>
                  {scopeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredTags.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No tags yet. Create your first tag.
              </div>
            ) : (
              filteredTags.map((tag) => (
                <div key={tag.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <TagIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tag.name}</span>
                        <Badge variant="outline">{tag.scope}</Badge>
                        <Badge variant="secondary">{tag.tagType}</Badge>
                      </div>
                      {tag.description ? (
                        <p className="text-sm text-muted-foreground">{tag.description}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" asChild>
                      <Link href={`/admin/tags/${tag.id}`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                     
                      variant="ghost"
                      onClick={() =>
                        deleteTagMutation.mutate(tag.id, {
                          onSuccess: () => toast.success("Tag archived."),
                          onError: (error) =>
                            toast.error(error instanceof Error ? error.message : "Failed to delete tag."),
                        })
                      }
                    >
                      <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                      Archive
                    </Button>
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
