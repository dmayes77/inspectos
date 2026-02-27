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
import { Plus, Workflow as WorkflowIcon, Pencil, Trash2 } from "lucide-react";
import { useDeleteWorkflow, useWorkflows } from "@/hooks/use-workflows";
import type { Workflow } from "@/types/workflow";
import { toast } from "sonner";
import { toSlugIdSegment } from "@/lib/routing/slug-id";

export default function WorkflowsPage() {
  const { data: workflows = [] } = useWorkflows();
  const deleteWorkflow = useDeleteWorkflow();
  const [deleteWorkflowId, setDeleteWorkflowId] = useState<string | null>(null);

  const handleDeleteWorkflow = () => {
    if (!deleteWorkflowId) return;
    deleteWorkflow.mutate(deleteWorkflowId, {
      onSuccess: () => {
        toast.success("Workflow deleted.");
        setDeleteWorkflowId(null);
      },
      onError: (error) =>
        toast.error(error instanceof Error ? error.message : "Failed to delete workflow."),
    });
  };

  return (
    <>
    <div className="space-y-6">
      <AdminPageHeader
        title="Workflows"
        description="Automate actions when tags or statuses change"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/workflows/runs">View Runs</Link>
            </Button>
            <Button asChild>
              <Link href="/workflows/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Workflow
              </Link>
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>All Workflows</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {workflows.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              No workflows yet. Create your first workflow.
            </div>
          ) : (
            workflows.map((workflow: Workflow) => (
              <div key={workflow.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                    <WorkflowIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{workflow.name}</span>
                      {workflow.isSystem ? <Badge color="light">System</Badge> : null}
                      {!workflow.isActive ? <Badge color="light">Off</Badge> : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {workflow.triggerScope} · {workflow.triggerType.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" asChild>
                    <Link href={`/workflows/${toSlugIdSegment(workflow.name, workflow.id)}`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  {!workflow.isSystem ? (
                    <Button variant="ghost" onClick={() => setDeleteWorkflowId(workflow.id)}>
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
    <AlertDialog open={Boolean(deleteWorkflowId)} onOpenChange={(open) => (!open ? setDeleteWorkflowId(null) : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete workflow?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this workflow? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteWorkflow.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteWorkflow}
            disabled={deleteWorkflow.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteWorkflow.isPending ? "Deleting..." : "Delete Anyway"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
