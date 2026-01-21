"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Workflow as WorkflowIcon, Trash2, Mail, Tag, Clock, Bell, ArrowDown, ArrowUp, ChevronLeft, Users } from "lucide-react";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTags } from "@/hooks/use-tags";
import { useCreateWorkflow, useUpdateWorkflow, useWorkflows } from "@/hooks/use-workflows";
import { useEmailTemplates } from "@/hooks/use-email-templates";
import type { Workflow, WorkflowScope, WorkflowTriggerType } from "@/types/workflow";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { toast } from "sonner";
import Link from "next/link";

const scopeOptions: { value: WorkflowScope; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "client", label: "Client" },
  { value: "inspection", label: "Inspection" },
  { value: "invoice", label: "Invoice" },
  { value: "job", label: "Job" },
  { value: "payment", label: "Payment" },
  { value: "service", label: "Service" },
  { value: "template", label: "Template" },
];

const triggerOptions: { value: WorkflowTriggerType; label: string }[] = [
  { value: "tag_added", label: "Tag added" },
  { value: "tag_removed", label: "Tag removed" },
  { value: "status_changed", label: "Status changed" },
  { value: "event", label: "Event" },
];

const leadStageOptions = [
  { value: "new", label: "New" },
  { value: "qualified", label: "Qualified" },
  { value: "quoted", label: "Quoted" },
  { value: "scheduled", label: "Scheduled" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

const actionOptions = [
  { value: "send_email", label: "Send Email", icon: Mail, color: "bg-blue-100 text-blue-600" },
  { value: "add_tag", label: "Add Tag", icon: Tag, color: "bg-emerald-100 text-emerald-600" },
  { value: "remove_tag", label: "Remove Tag", icon: Tag, color: "bg-rose-100 text-rose-600" },
  { value: "wait", label: "Wait", icon: Clock, color: "bg-slate-100 text-slate-600" },
  { value: "notify", label: "Notify Team", icon: Bell, color: "bg-amber-100 text-amber-600" },
  { value: "convert_lead_to_client", label: "Convert Lead to Client", icon: Users, color: "bg-indigo-100 text-indigo-600" },
];

type WorkflowAction = {
  id: string;
  type: string;
  config: Record<string, unknown>;
};

type WorkflowConditions = {
  includeTagIds?: string[];
  excludeTagIds?: string[];
  statusEquals?: string;
};

function SortableAction({
  action,
  children,
}: {
  action: WorkflowAction;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: action.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "opacity-70" : undefined}>
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        {children}
      </div>
    </div>
  );
}

export function WorkflowEditor() {
  const params = useParams();
  const router = useRouter();
  const workflowId = typeof params.id === "string" ? params.id : null;

  const { data: workflows = [] } = useWorkflows();
  const { data: tags = [] } = useTags();
  const { data: emailTemplates = [] } = useEmailTemplates();
  const createWorkflow = useCreateWorkflow();
  const updateWorkflow = useUpdateWorkflow();

  const existing = workflows.find((workflow) => workflow.id === workflowId) ?? null;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const [form, setForm] = useState<Partial<Workflow>>({
    name: existing?.name ?? "",
    description: existing?.description ?? "",
    triggerScope: existing?.triggerScope ?? "lead",
    triggerType: existing?.triggerType ?? "tag_added",
    triggerTagId: existing?.triggerTagId ?? null,
    delayMinutes: existing?.delayMinutes ?? 0,
    isActive: existing?.isActive ?? true,
    conditions: existing?.conditions ?? { includeTagIds: [], excludeTagIds: [] },
    actions: (existing?.actions ?? []).map((action) => ({
      id: crypto.randomUUID(),
      ...action,
    })),
  });
  const [pendingActionType, setPendingActionType] = useState<string>("send_email");

  const scopedTags = useMemo(() => {
    return tags.filter((tag) => tag.scope === form.triggerScope);
  }, [tags, form.triggerScope]);
  const conditionState = (form.conditions ?? {}) as WorkflowConditions;

  const addAction = () => {
    const actionType = pendingActionType;
    const config: Record<string, unknown> =
      actionType === "send_email"
        ? { templateId: "" }
        : actionType === "add_tag" || actionType === "remove_tag"
        ? { tagId: "" }
        : actionType === "wait"
        ? { minutes: 60 }
        : actionType === "notify"
        ? { message: "" }
        : actionType === "convert_lead_to_client"
        ? { deleteLead: false }
        : {};

    const nextAction: WorkflowAction = {
      id: crypto.randomUUID(),
      type: actionType,
      config,
    };

    setForm((prev) => ({
      ...prev,
      actions: [...(prev.actions ?? []), nextAction],
    }));
  };

  const updateAction = (id: string, patch: Partial<WorkflowAction>) => {
    setForm((prev) => ({
      ...prev,
      actions: (prev.actions ?? []).map((action) =>
        (action as WorkflowAction).id === id ? { ...(action as WorkflowAction), ...patch } : action
      ),
    }));
  };

  const removeAction = (id: string) => {
    setForm((prev) => ({
      ...prev,
      actions: (prev.actions ?? []).filter((action) => (action as WorkflowAction).id !== id),
    }));
  };

  const moveAction = (id: string, direction: "up" | "down") => {
    setForm((prev) => {
      const actions = [...(prev.actions ?? [])] as WorkflowAction[];
      const index = actions.findIndex((action) => action.id === id);
      if (index === -1) return prev;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= actions.length) return prev;
      [actions[index], actions[targetIndex]] = [actions[targetIndex], actions[index]];
      return { ...prev, actions };
    });
  };

  const handleDragEnd = (event: { active: { id: string | number }; over?: { id: string | number } | null }) => {
    if (!event.over || event.active.id === event.over.id) return;
    setForm((prev) => {
      const actions = [...(prev.actions ?? [])] as WorkflowAction[];
      const activeId = String(event.active.id);
      const overId = String(event.over?.id);
      const oldIndex = actions.findIndex((action) => action.id === activeId);
      const newIndex = actions.findIndex((action) => action.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return { ...prev, actions: arrayMove(actions, oldIndex, newIndex) };
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name?.trim()) {
      toast.error("Workflow name is required.");
      return;
    }

    const actions = Array.isArray(form.actions)
      ? form.actions.map((action) => {
          if (typeof action === "object" && action) {
            const { id, ...rest } = action as WorkflowAction;
            return rest;
          }
          return action;
        })
      : [];

    if (existing) {
      updateWorkflow.mutate(
        { id: existing.id, ...form, actions, conditions: form.conditions ?? {} },
        {
          onSuccess: () => {
            toast.success("Workflow updated.");
            router.push("/admin/workflows");
          },
          onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to update workflow.");
          },
        }
      );
      return;
    }

    createWorkflow.mutate(
      { ...form, actions, conditions: form.conditions ?? {} },
      {
        onSuccess: () => {
          toast.success("Workflow created.");
          router.push("/admin/workflows");
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to create workflow.");
        },
      }
    );
  };

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/admin/workflows">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Workflows
          </Link>
        </Button>

        <AdminPageHeader
          title={existing ? "Edit Workflow" : "New Workflow"}
          description="Define triggers and actions for automation"
          actions={
            <Button onClick={handleSubmit}>
              {existing ? "Save Changes" : "Create Workflow"}
            </Button>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
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
                <Label>Trigger scope</Label>
                <Select
                  value={(form.triggerScope ?? "lead") as WorkflowScope}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, triggerScope: value as WorkflowScope, triggerTagId: null }))}
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
                <Label>Trigger type</Label>
                <Select
                  value={(form.triggerType ?? "tag_added") as WorkflowTriggerType}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, triggerType: value as WorkflowTriggerType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(form.triggerType === "tag_added" || form.triggerType === "tag_removed") && (
                <div className="space-y-2">
                  <Label>Trigger tag</Label>
                  <Select
                    value={form.triggerTagId ?? "none"}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, triggerTagId: value === "none" ? null : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No tag</SelectItem>
                      {scopedTags.map((tag) => (
                        <SelectItem key={tag.id} value={tag.id}>
                          {tag.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {form.triggerType === "status_changed" ? (
                <div className="space-y-2">
                  <Label>Status match (optional)</Label>
                  {form.triggerScope === "lead" ? (
                    <Select
                      value={(conditionState.statusEquals as string) ?? "any"}
                      onValueChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          conditions: { ...conditionState, statusEquals: value === "any" ? undefined : value },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any status</SelectItem>
                        {leadStageOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={(conditionState.statusEquals as string) ?? ""}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          conditions: { ...conditionState, statusEquals: event.target.value || undefined },
                        }))
                      }
                      placeholder="Enter status value"
                    />
                  )}
                </div>
              ) : null}
              <div className="space-y-2">
                <Label>Delay (minutes)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.delayMinutes ?? 0}
                  onChange={(e) => setForm((prev) => ({ ...prev, delayMinutes: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground">Conditions</div>
                <div className="rounded-md border p-3 space-y-3">
                  <div className="space-y-2">
                    <Label>Must have tags</Label>
                    <div className="space-y-2">
                      {scopedTags.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No tags for this scope.</div>
                      ) : (
                        scopedTags.map((tag) => {
                          const selected = conditionState.includeTagIds?.includes(tag.id) ?? false;
                          return (
                            <label key={tag.id} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={(event) => {
                                  const next = new Set(conditionState.includeTagIds ?? []);
                                  if (event.target.checked) {
                                    next.add(tag.id);
                                  } else {
                                    next.delete(tag.id);
                                  }
                                  setForm((prev) => ({
                                    ...prev,
                                    conditions: { ...conditionState, includeTagIds: Array.from(next) },
                                  }));
                                }}
                              />
                              <span>{tag.name}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Must not have tags</Label>
                    <div className="space-y-2">
                      {scopedTags.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No tags for this scope.</div>
                      ) : (
                        scopedTags.map((tag) => {
                          const selected = conditionState.excludeTagIds?.includes(tag.id) ?? false;
                          return (
                            <label key={tag.id} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={(event) => {
                                  const next = new Set(conditionState.excludeTagIds ?? []);
                                  if (event.target.checked) {
                                    next.add(tag.id);
                                  } else {
                                    next.delete(tag.id);
                                  }
                                  setForm((prev) => ({
                                    ...prev,
                                    conditions: { ...conditionState, excludeTagIds: Array.from(next) },
                                  }));
                                }}
                              />
                              <span>{tag.name}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {existing ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{existing.triggerScope}</Badge>
                  <Badge variant="outline">{existing.triggerType.replace("_", " ")}</Badge>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Select value={pendingActionType} onValueChange={setPendingActionType}>
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {actionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" size="sm" variant="outline" onClick={addAction}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
              {(form.actions ?? []).length === 0 ? (
                <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                  No actions yet. Add at least one action for this workflow.
                </div>
              ) : (
                <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                  <SortableContext
                    items={(form.actions ?? []).map((action) => (action as WorkflowAction).id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {(form.actions ?? []).map((action) => {
                        const actionData = action as WorkflowAction;
                        const meta = actionOptions.find((option) => option.value === actionData.type);
                        const Icon = meta?.icon ?? WorkflowIcon;
                        const color = meta?.color ?? "bg-muted text-muted-foreground";

                        return (
                          <SortableAction key={actionData.id} action={actionData}>
                            <div className="rounded-lg border p-3 space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <div className={`h-7 w-7 rounded-full flex items-center justify-center ${color}`}>
                                    <Icon className="h-3.5 w-3.5" />
                                  </div>
                                  <span className="text-sm font-medium">{meta?.label ?? actionData.type}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button type="button" size="icon" variant="ghost" onClick={() => moveAction(actionData.id, "up")}>
                                    <ArrowUp className="h-4 w-4" />
                                  </Button>
                                  <Button type="button" size="icon" variant="ghost" onClick={() => moveAction(actionData.id, "down")}>
                                    <ArrowDown className="h-4 w-4" />
                                  </Button>
                                  <Button type="button" size="icon" variant="ghost" onClick={() => removeAction(actionData.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                              {actionData.type === "send_email" ? (
                                <div className="space-y-2">
                                  <Label>Email template</Label>
                                  <Select
                                    value={(actionData.config.templateId as string) ?? "none"}
                                    onValueChange={(value) =>
                                      updateAction(actionData.id, { config: { ...actionData.config, templateId: value === "none" ? "" : value } })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select template" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">No template</SelectItem>
                                      {emailTemplates.map((template) => (
                                        <SelectItem key={template.id} value={template.id}>
                                          {template.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              ) : null}
                              {actionData.type === "add_tag" || actionData.type === "remove_tag" ? (
                                <div className="space-y-2">
                                  <Label>Tag</Label>
                                  <Select
                                    value={(actionData.config.tagId as string) ?? "none"}
                                    onValueChange={(value) =>
                                      updateAction(actionData.id, { config: { ...actionData.config, tagId: value === "none" ? "" : value } })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select tag" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">No tag</SelectItem>
                                      {scopedTags.map((tag) => (
                                        <SelectItem key={tag.id} value={tag.id}>
                                          {tag.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              ) : null}
                              {actionData.type === "wait" ? (
                                <div className="space-y-2">
                                  <Label>Wait (minutes)</Label>
                                  <Input
                                    type="number"
                                    min={1}
                                    value={(actionData.config.minutes as number) ?? 60}
                                    onChange={(e) =>
                                      updateAction(actionData.id, {
                                        config: { ...actionData.config, minutes: Number(e.target.value) },
                                      })
                                    }
                                  />
                                </div>
                              ) : null}
                              {actionData.type === "notify" ? (
                                <div className="space-y-2">
                                  <Label>Message</Label>
                                  <Textarea
                                    value={(actionData.config.message as string) ?? ""}
                                    onChange={(e) =>
                                      updateAction(actionData.id, {
                                        config: { ...actionData.config, message: e.target.value },
                                      })
                                    }
                                    rows={2}
                                  />
                                </div>
                              ) : null}
                              {actionData.type === "convert_lead_to_client" ? (
                                <div className="space-y-2">
                                  <Label>Conversion options</Label>
                                  <label className="flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={(actionData.config.deleteLead as boolean) ?? false}
                                      onChange={(event) =>
                                        updateAction(actionData.id, {
                                          config: { ...actionData.config, deleteLead: event.target.checked },
                                        })
                                      }
                                    />
                                    <span>Delete lead after conversion</span>
                                  </label>
                                </div>
                              ) : null}
                            </div>
                          </SortableAction>
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
