"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { ResourceDetailLayout } from "@/components/shared/resource-detail-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BackButton } from "@/components/ui/back-button";
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
import { RecordInformationCard } from "@/components/shared/record-information-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { useAgentById, useDeleteAgent, useSendAgentPortalLink } from "@/hooks/use-agents";
import { formatTimestamp } from "@/lib/utils/dates";
import { toast } from "sonner";
import { UserCheck, Mail, Phone, Building2, ClipboardList, DollarSign, FileText, Send, ShieldCheck, Edit, Trash2, type LucideIcon } from "lucide-react";

const formatAgentCode = (id?: string | null) => {
  if (!id) return "AG-0000";
  const clean = id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `AG-${clean.slice(-4).padStart(4, "0")}`;
};

type Params = { id: string };

type Stat = { label: string; value: string | number; icon: LucideIcon };

type NotificationRow = { label: string; description: string; enabled: boolean };

export default function AgentDetailPage() {
  const params = useParams();
  const { id: agentId } = params as Params;
  const router = useRouter();
  const { data: agent, isLoading } = useAgentById(agentId);
  const deleteAgent = useDeleteAgent();
  const sendPortalLink = useSendAgentPortalLink();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <AdminShell user={mockAdminUser}>
        <div className="py-12 text-center text-muted-foreground">Loading agent...</div>
      </AdminShell>
    );
  }

  if (!agent) {
    return (
      <AdminShell user={mockAdminUser}>
        <ResourceDetailLayout
          breadcrumb={
            <>
              <Link href="/admin/overview" className="hover:text-foreground">
                Overview
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href="/admin/partners" className="hover:text-foreground">
                Partners
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href="/admin/partners/agents" className="hover:text-foreground">
                Agents
              </Link>
            </>
          }
          title="Agent Not Found"
          description="We couldn't locate that agent record."
          backHref="/admin/partners/agents"
          main={
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">Select another agent from the directory.</CardContent>
            </Card>
          }
          sidebar={<RecordInformationCard createdAt={null} updatedAt={null} />}
        />
      </AdminShell>
    );
  }

  const avatarInitials =
    agent.name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "AG";

  const stats: Stat[] = [
    { label: "Referrals", value: agent.total_referrals, icon: ClipboardList },
    { label: "Revenue", value: `$${agent.total_revenue.toLocaleString()}`, icon: DollarSign },
    { label: "Orders", value: agent._count?.orders ?? agent.orders?.length ?? 0, icon: FileText },
  ];

  const notifications: NotificationRow[] = [
    {
      label: "Schedule updates",
      description: "Send when an inspection date is booked or moved.",
      enabled: agent.notify_on_schedule,
    },
    {
      label: "Completion updates",
      description: "Alert when the inspection wraps up.",
      enabled: agent.notify_on_complete,
    },
    {
      label: "Report delivered",
      description: "Share a link to the final report as soon as it's ready.",
      enabled: agent.notify_on_report,
    },
  ];

  const breadcrumb = (
    <>
      <Link href="/admin/overview" className="hover:text-foreground">
        Overview
      </Link>
      <span className="text-muted-foreground">/</span>
      <Link href="/admin/partners" className="hover:text-foreground">
        Partners
      </Link>
      <span className="text-muted-foreground">/</span>
      <Link href="/admin/partners/agents" className="hover:text-foreground">
        Agents
      </Link>
      <span className="text-muted-foreground">/</span>
      <span>{agent.name}</span>
    </>
  );

  const hasPortalAccess = Boolean(agent.magic_link_token && agent.magic_link_expires_at && new Date(agent.magic_link_expires_at) > new Date());
  const agentCode = formatAgentCode(agent.id);
  const partnerSince = agent.created_at ? formatTimestamp(agent.created_at) : null;

  const handleDelete = () => {
    deleteAgent.mutate(agent.id, {
      onSuccess: () => {
        toast.success("Agent deleted");
        router.push("/admin/partners/agents");
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : "Failed to delete agent";
        toast.error(message);
      },
    });
  };

  const handlePortalLink = () => {
    sendPortalLink.mutate(agent.id, {
      onSuccess: () => {
        toast.success("Portal link sent");
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : "Failed to send portal link";
        toast.error(message);
      },
    });
  };

  const orders = agent.orders ?? [];

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <BackButton href="/admin/partners/agents" label="Back to Agents" variant="ghost" />

        <AdminPageHeader
          title={
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                <AvatarImage src={agent.avatar_url ?? undefined} alt={agent.name} />
                <AvatarFallback>{avatarInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start">
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{agent.name}</h1>
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <Badge variant={agent.status === "active" ? "default" : "secondary"} className="capitalize">
                      {agent.status}
                    </Badge>
                    <Badge variant="outline">{agent.agency ? agent.agency.name : "Independent"}</Badge>
                    <Badge variant="secondary" className="capitalize">
                      {agent.preferred_report_format} reports
                    </Badge>
                  </div>
                </div>
                <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{agentCode}</div>
                {partnerSince && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground sm:justify-start">
                    <span className="font-medium">Partner since</span>
                    <span>{partnerSince}</span>
                  </div>
                )}
                {agent.license_number && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium">License:</span> {agent.license_number}
                  </div>
                )}
              </div>
            </div>
          }
          actions={
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              {agent.agency ? (
                <Button variant="outline" className="w-full sm:w-auto" asChild>
                  <Link href={`/admin/partners/agencies/${agent.agency.id}`}>
                    <Building2 className="mr-2 h-4 w-4" /> View agency
                  </Link>
                </Button>
              ) : null}
              <Button className="w-full sm:w-auto" asChild>
                <Link href={`/admin/partners/agents/${agent.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full text-destructive hover:bg-destructive/5 hover:text-destructive sm:w-auto"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </div>
          }
        />

        <div className="space-y-6">
          <div className="flex flex-col gap-6 lg:flex-row">
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-base">Contact information</CardTitle>
                <CardDescription>How your team reaches this agent.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    {agent.email ? (
                      <a href={`mailto:${agent.email}`} className="text-sm text-primary hover:underline">
                        {agent.email}
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">No email on file</p>
                    )}
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    {agent.phone ? (
                      <a href={`tel:${agent.phone}`} className="text-sm text-primary hover:underline">
                        {agent.phone}
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">No phone on file</p>
                    )}
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">License</p>
                    <p className="text-sm text-muted-foreground">{agent.license_number ?? "Not provided"}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Preferred report format</p>
                    <p className="text-sm font-medium capitalize">{agent.preferred_report_format}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-6 lg:w-80">
              <Card>
                <CardHeader>
                  <CardTitle>Brokerage</CardTitle>
                  <CardDescription>The agency linked to this agent.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {agent.agency ? (
                    <>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <Link href={`/admin/partners/agencies/${agent.agency.id}`} className="hover:underline">
                          {agent.agency.name}
                        </Link>
                      </div>
                      <p className="text-muted-foreground">{agent.agency.email ?? "No shared email"}</p>
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href={`/admin/partners/agencies/${agent.agency.id}`}>Open agency</Link>
                      </Button>
                    </>
                  ) : (
                    <p className="text-muted-foreground">This agent operates independently.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Portal Access</CardTitle>
                  <CardDescription>Control the Inspector Portal invite.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{hasPortalAccess ? "Active link" : "No access"}</span>
                  </div>
                  {agent.magic_link_expires_at && <p className="text-muted-foreground">Expires {formatTimestamp(agent.magic_link_expires_at)}</p>}
                  {agent.last_portal_access_at && <p className="text-muted-foreground">Last access {formatTimestamp(agent.last_portal_access_at)}</p>}
                  <Button variant="outline" className="w-full justify-start" onClick={handlePortalLink} disabled={sendPortalLink.isPending}>
                    <Send className="mr-2 h-4 w-4" />
                    {sendPortalLink.isPending ? "Sending..." : hasPortalAccess ? "Resend link" : "Send link"}
                  </Button>
                </CardContent>
              </Card>

              <RecordInformationCard createdAt={agent.created_at} updatedAt={agent.updated_at} />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-muted-foreground" /> Overview
              </CardTitle>
              <CardDescription>Performance metrics for this agent.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <stat.icon className="h-4 w-4" />
                    {stat.label}
                  </div>
                  <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Automated updates this agent receives.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifications.map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-4 rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{row.label}</p>
                    <p className="text-sm text-muted-foreground">{row.description}</p>
                  </div>
                  <Badge variant={row.enabled ? "secondary" : "outline"}>{row.enabled ? "On" : "Off"}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {agent.notes ? <p className="text-sm leading-6">{agent.notes}</p> : <p className="text-sm text-muted-foreground">No notes yet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Activity tied to this agent.</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders linked yet.</p>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                      <div>
                        <p className="font-medium">{order.order_number}</p>
                        <p className="text-muted-foreground">
                          {order.property ? `${order.property.address_line1}, ${order.property.city}, ${order.property.state}` : "No property linked"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">{order.status}</p>
                        {order.scheduled_date && <p className="text-xs text-muted-foreground">Scheduled {formatTimestamp(order.scheduled_date)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete agent?</AlertDialogTitle>
            <AlertDialogDescription>This removes {agent.name} and their referral history links. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
