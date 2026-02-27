"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Tag as TagIcon, Pencil } from "lucide-react";
import { useDeleteTag, useTags } from "@/hooks/use-tags";
import type { TagScope } from "@/types/tag";
import { toast } from "sonner";
import { toSlugIdSegment } from "@/lib/routing/slug-id";

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
  const [deleteTagId, setDeleteTagId] = useState<string | null>(null);

  const handleConfirmDeleteTag = () => {
    if (!deleteTagId) return;
    deleteTagMutation.mutate(deleteTagId, {
      onSuccess: () => {
        toast.success("Tag archived.");
        setDeleteTagId(null);
      },
      onError: (error) =>
        toast.error(error instanceof Error ? error.message : "Failed to delete tag."),
    });
  };

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
            <Link href="/tags/new">
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
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                No tags yet. Create your first tag.
              </div>
            ) : (
              filteredTags.map((tag) => (
                <div key={tag.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                      <TagIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tag.name}</span>
                        <Badge color="light">{tag.scope}</Badge>
                        <Badge color="light">{tag.tagType}</Badge>
                      </div>
                      {tag.description ? (
                        <p className="text-sm text-muted-foreground">{tag.description}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" asChild>
                      <Link href={`/tags/${toSlugIdSegment(tag.name, tag.id)}`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                    <Button variant="ghost" onClick={() => setDeleteTagId(tag.id)}>
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
    <AlertDialog open={Boolean(deleteTagId)} onOpenChange={(open) => (!open ? setDeleteTagId(null) : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive this tag?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure? This removes the tag from active use and cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteTagMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmDeleteTag}
            disabled={deleteTagMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteTagMutation.isPending ? "Archiving..." : "Delete Anyway"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
