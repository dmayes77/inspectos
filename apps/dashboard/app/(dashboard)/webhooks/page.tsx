"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Webhook, Pause, Play, Trash2, ExternalLink, TestTube } from "lucide-react";
import { useWebhooks, useDeleteWebhook, useUpdateWebhook } from "@/hooks/use-webhooks";
import { WebhookDialog } from "@/components/webhooks/webhook-dialog";
import { TestWebhookDialog } from "@/components/webhooks/test-webhook-dialog";
import { toast } from "sonner";
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
import { ModernDataTable } from "@/components/ui/modern-data-table";

export default function WebhooksPage() {
  const { data: webhooks = [], isLoading } = useWebhooks();
  const deleteWebhook = useDeleteWebhook();
  const updateWebhook = useUpdateWebhook();

  const [editingWebhook, setEditingWebhook] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [deletingWebhook, setDeletingWebhook] = useState<string | null>(null);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";

    try {
      await updateWebhook.mutateAsync({ id, status: newStatus });
      toast.success(
        newStatus === "active" ? "Webhook activated" : "Webhook paused"
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      toast.error("Failed to update webhook status");
    }
  };

  const handleDelete = async () => {
    if (!deletingWebhook) return;

    try {
      await deleteWebhook.mutateAsync(deletingWebhook);
      toast.success("Webhook deleted");
      setDeletingWebhook(null);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      toast.error("Failed to delete webhook");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge color="success">Active</Badge>;
      case "paused":
        return <Badge color="warning">Paused</Badge>;
      case "failed":
        return <Badge color="error">Failed</Badge>;
      default:
        return <Badge color="light" className="border border-border">{status}</Badge>;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const webhookColumns = useMemo<ColumnDef<(typeof webhooks)[number]>[]>(
    () => [
      {
        accessorKey: "name",
        enableSorting: false,
        header: "Name",
        cell: ({ row }) => {
          const webhook = row.original;
          return (
            <div>
              <div className="font-medium">{webhook.name}</div>
              {webhook.description && (
                <div className="text-xs text-muted-foreground">{webhook.description}</div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "url",
        enableSorting: false,
        header: "URL",
        cell: ({ row }) => {
          const webhook = row.original;
          return (
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-2 py-1 rounded-sm">{new URL(webhook.url).hostname}</code>
              <a
                href={webhook.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          );
        },
      },
      {
        accessorKey: "events",
        enableSorting: false,
        header: "Events",
        cell: ({ row }) => (
          <Badge color="light" className="border border-border">
            {row.original.events.length} events
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        enableSorting: false,
        header: "Status",
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        accessorKey: "last_triggered_at",
        enableSorting: false,
        header: "Last Triggered",
        cell: ({ row }) => {
          const webhook = row.original;
          return (
            <div className="text-sm">
              {formatDate(webhook.last_triggered_at)}
              {webhook.failure_count > 0 && (
                <div className="text-xs text-red-500">{webhook.failure_count} failures</div>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        enableSorting: false,
        header: "",
        cell: ({ row }) => {
          const webhook = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setTestingWebhook(webhook.id)}>
                  <TestTube className="mr-2 h-4 w-4" />
                  Test Webhook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditingWebhook(webhook.id)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleToggleStatus(webhook.id, webhook.status)}>
                  {webhook.status === "active" ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeletingWebhook(webhook.id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [webhooks]
  );

  return (
    <div className="space-y-4">
          <PageHeader
            breadcrumb={
            <>
              <Link href="/overview" className="hover:text-foreground">
                Overview
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href="/webhooks" className="hover:text-foreground">
                Webhooks
              </Link>
              <span className="text-muted-foreground">/</span>
              <span>Webhooks</span>
            </>
          }
          title="Webhooks"
          description="Integrate with external services like Zapier, Make, and custom applications."
          actions={
          <Button asChild>
            <Link href="/webhooks/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Webhook
            </Link>
          </Button>
          }
        />

        {webhooks.length === 0 && !isLoading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Webhook className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No webhooks configured</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                Webhooks allow you to receive real-time notifications when events occur in your account.
                Connect to Zapier, Make, or your own custom applications.
              </p>
              <Button asChild>
                <Link href="/webhooks/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Webhook
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ModernDataTable
            columns={webhookColumns}
            data={webhooks}
            title="Configured Webhooks"
            description="Manage your webhook integrations and monitor delivery status."
            isLoading={isLoading}
            loadingState={
              <div className="text-center py-8 text-muted-foreground">
                Loading webhooks...
              </div>
            }
          />
        )}

      {editingWebhook && (
        <WebhookDialog
          open={!!editingWebhook}
          onOpenChange={(open) => !open && setEditingWebhook(null)}
          mode="edit"
          webhookId={editingWebhook}
        />
      )}

      {testingWebhook && (
        <TestWebhookDialog
          open={!!testingWebhook}
          onOpenChange={(open) => !open && setTestingWebhook(null)}
          webhookId={testingWebhook}
        />
      )}

      <AlertDialog open={!!deletingWebhook} onOpenChange={(open) => !open && setDeletingWebhook(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this webhook? This action cannot be undone.
              All delivery logs will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
