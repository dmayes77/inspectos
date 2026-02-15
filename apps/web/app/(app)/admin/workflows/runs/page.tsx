"use client";

import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkflowRuns } from "@/hooks/use-workflow-runs";

export default function WorkflowRunsPage() {
  const { data: runs = [] } = useWorkflowRuns();

  return (
    <>
    <div className="space-y-6">

      <AdminPageHeader title="Workflow Runs" description="Execution history for automation workflows" />

      <Card>
        <CardHeader>
          <CardTitle>Recent Runs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {runs.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No workflow runs yet.
            </div>
          ) : (
            runs.map((run) => (
              <div key={run.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">{run.workflowId}</div>
                  <div className="text-xs text-muted-foreground">
                    {run.scope} · {run.entityId}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{run.status}</Badge>
                  <span>{new Date(run.startedAt).toLocaleString()}</span>
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
