"use client";

import { useMemo, useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowRight, Sparkles } from "lucide-react";
import { AdminTabSwitch } from "@/components/layout/admin-tab-switch";
import Link from "next/link";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { toast } from "sonner";
import { useWebhooks } from "@/hooks/use-webhooks";
import { useWorkflows, useUpdateWorkflow } from "@/hooks/use-workflows";
import type { Webhook } from "@/lib/types/webhook";
const formatEventLabel = (value: string) =>
  value
    .split(".")
    .map((segment) =>
      segment
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ")
    )
    .join(" · ");

export default function AutomationsPage() {
  const { data: webhooks = [] } = useWebhooks();
  const { data: workflows = [], isLoading: workflowsLoading } = useWorkflows();
  const updateWorkflow = useUpdateWorkflow();
  const [automationTab, setAutomationTab] = useState<"event" | "rule">("event");
  const [isUpdating, setIsUpdating] = useState(false);

  const eventStats = useMemo(() => {
    const map = new Map<string, { total: number; active: number; failureCount: number }>();
    webhooks.forEach((webhook: Webhook) => {
      webhook.events.forEach((event) => {
        const stats = map.get(event) ?? { total: 0, active: 0, failureCount: 0 };
        stats.total += 1;
        if (webhook.status === "active") stats.active += 1;
        stats.failureCount += webhook.failure_count ?? 0;
        map.set(event, stats);
      });
    });
    return map;
  }, [webhooks]);

  const eventWorkflows = workflows.filter((workflow) => workflow.triggerType === "event");
  const ruleWorkflows = workflows.filter((workflow) => workflow.triggerType !== "event");
  const activeCount = workflows.filter((workflow) => workflow.isActive).length;

  const updateState = (workflowId: string, isActive: boolean) => {
    setIsUpdating(true);
    updateWorkflow.mutate({ id: workflowId, isActive }, {
      onSuccess: () => {
        toast.success(isActive ? "Automation activated" : "Automation paused");
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to update automation");
      },
      onSettled: () => {
        setIsUpdating(false);
      },
    });
  };

  const handleToggle = (workflow: typeof workflows[number]) => {
    updateState(workflow.id, !workflow.isActive);
  };

  const renderEventContent = () => {
    if (eventWorkflows.length === 0) {
      return <div className="text-sm text-muted-foreground">No event automations yet.</div>;
    }

    return eventWorkflows.map((workflow) => {
      const stats = workflow.eventType
        ? eventStats.get(workflow.eventType) ?? { total: 0, active: 0, failureCount: 0 }
        : { total: 0, active: 0, failureCount: 0 };

      return (
        <div
          key={workflow.id}
          className="flex flex-col gap-4 rounded-lg border p-4 transition hover:shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-muted-foreground">
                {formatEventLabel(workflow.eventType ?? "event")}
              </p>
              <p className="text-lg font-semibold">{workflow.name}</p>
              <p className="text-sm text-muted-foreground">{workflow.description}</p>
            </div>
              <Switch
                checked={workflow.isActive ?? false}
                onCheckedChange={() => handleToggle(workflow)}
                disabled={isUpdating}
              />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <Badge variant="secondary">
              {stats.total} webhook{stats.total === 1 ? "" : "s"}
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {stats.active} active
            </Badge>
            <Badge variant="destructive" className="bg-red-100 text-red-800">
              {stats.failureCount} failures
            </Badge>
            <Button variant="link" size="sm" asChild>
              <Link href={`/admin/workflows/${workflow.id}`}>View definition</Link>
            </Button>
          </div>
        </div>
      );
    });
  };

  const renderRuleContent = () => {
    if (ruleWorkflows.length === 0) {
      return <div className="text-sm text-muted-foreground">No rule automations yet.</div>;
    }

    return ruleWorkflows.map((workflow) => (
      <div
        key={workflow.id}
        className="flex flex-col gap-4 rounded-lg border p-4 transition hover:shadow"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">
              {workflow.triggerType.replace("_", " ")} · {workflow.triggerScope}
            </p>
            <p className="text-lg font-semibold">{workflow.name}</p>
            <p className="text-sm text-muted-foreground">{workflow.description}</p>
          </div>
          <Switch
            checked={workflow.isActive ?? false}
            onCheckedChange={() => handleToggle(workflow)}
            disabled={isUpdating}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <Badge variant="outline">{workflow.delayMinutes ?? 0} min delay</Badge>
          <Button variant="link" size="sm" asChild>
            <Link href={`/admin/workflows/${workflow.id}`}>Edit workflow</Link>
          </Button>
        </div>
      </div>
    ));
  };

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Automations"
          description="Turn events and workflows into action with a single builder"
          actions={
            <Button variant="outline" asChild>
              <Link href="/admin/workflows/new">
                Create Automation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />

        <section aria-label="Automation builder" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Automation Builder
                </CardTitle>
                <CardDescription className="max-w-lg">
                  Toggle between event-driven automations and rule-based workflows, then publish actions with the builder.
                </CardDescription>
              </div>
              <AdminTabSwitch
                className="w-full sm:w-64 gap-2"
                value={automationTab}
                onValueChange={(value) => setAutomationTab(value as "event" | "rule")}
                items={[
                  { value: "event", label: "Event automations" },
                  { value: "rule", label: "Rule automations" },
                ]}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              {workflowsLoading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : automationTab === "event" ? (
                renderEventContent()
              ) : (
                renderRuleContent()
              )}
            </CardContent>
          </Card>
        </section>

        <section aria-label="Custom workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Custom Workflows
              </CardTitle>
              <CardDescription>
                Build complex automations with multi-step actions and conditions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
              <Sparkles className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Launch the workflow builder</p>
                <p className="text-xs text-muted-foreground">
                  Create multi-step automations with delays, tags, emails, and notifications.
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/admin/workflows/new">Open builder</Link>
                </Button>
              </div>
            </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </AdminShell>
  );
}
