"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAssignTag, useRemoveTag, useTagAssignments } from "@/hooks/use-tag-assignments";
import { useTags } from "@/hooks/use-tags";
import type { TagScope } from "@/types/tag";
import { X } from "lucide-react";
import { toast } from "sonner";

type TagAssignmentEditorProps = {
  scope: TagScope;
  entityId: string;
};

export function TagAssignmentEditor({ scope, entityId }: TagAssignmentEditorProps) {
  const { data: tags = [] } = useTags();
  const { data: assignedTagIds = [] } = useTagAssignments(scope, entityId);
  const assignTag = useAssignTag(scope, entityId);
  const removeTag = useRemoveTag(scope, entityId);
  const [selectedTagId, setSelectedTagId] = useState<string>("none");

  const scopedTags = useMemo(() => tags.filter((tag) => tag.scope === scope), [tags, scope]);
  const assignedTags = useMemo(
    () => scopedTags.filter((tag) => assignedTagIds.includes(tag.id)),
    [scopedTags, assignedTagIds]
  );
  const availableTags = useMemo(
    () => scopedTags.filter((tag) => !assignedTagIds.includes(tag.id)),
    [scopedTags, assignedTagIds]
  );

  const handleAssign = () => {
    if (!selectedTagId || selectedTagId === "none") return;
    assignTag.mutate(selectedTagId, {
      onSuccess: () => {
        setSelectedTagId("none");
        toast.success("Tag assigned.");
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to assign tag.");
      },
    });
  };

  const handleRemove = (tagId: string) => {
    removeTag.mutate(tagId, {
      onSuccess: () => toast.success("Tag removed."),
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to remove tag.");
      },
    });
  };

  return (
    <div className="space-y-3">
      {assignedTags.length === 0 ? (
        <div className="text-sm text-muted-foreground">No tags assigned yet.</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {assignedTags.map((tag) => (
            <Badge key={tag.id} color="light" className="flex items-center gap-1">
              {tag.name}
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => handleRemove(tag.id)}
                aria-label={`Remove ${tag.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={selectedTagId} onValueChange={setSelectedTagId}>
          <SelectTrigger className="h-8 w-full sm:w-64">
            <SelectValue placeholder="Add tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Select tag</SelectItem>
            {availableTags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                {tag.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="sm" onClick={handleAssign} disabled={selectedTagId === "none"}>
          Add Tag
        </Button>
      </div>
    </div>
  );
}
