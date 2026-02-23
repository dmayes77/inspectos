"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAgentById, useDeleteAgent, useSendAgentPortalLink } from "@/hooks/use-agents";
import { useQueryClient } from "@tanstack/react-query";
import { isAgentsQueryKey } from "@inspectos/shared/query";
import { formatTimestamp } from "@inspectos/shared/utils/dates";
import { toast } from "sonner";
import { UserCheck, Mail, Phone, Building2, ClipboardList, DollarSign, FileText, Send, ShieldCheck, Edit, Trash2, MapPin, type LucideIcon } from "lucide-react";
import { CompanyLogo } from "@/components/shared/company-logo";

const MAPS_BASE_URL = "https://www.google.com/maps/search/?api=1&query=";

const formatAgentCode = (id?: string | null) => {
  if (!id) return "AG-0000";
  const clean = id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `AG-${clean.slice(-4).padStart(4, "0")}`;
};

type Params = { id: string };

type Stat = { label: string; value: string | number; icon: LucideIcon };

type NotificationRow = { label: string; description: string; enabled: boolean };

type AgencyAddressFields = {
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
};

function formatAgencyAddress(agency: AgencyAddressFields | null | undefined, fallback?: string | null) {
  if (agency) {
    const segments: string[] = [];
    if (agency.address_line1) {
      segments.push(agency.address_line1.trim());
    }
    if (agency.address_line2) {
      segments.push(agency.address_line2.trim());
    }
    const cityState: string[] = [];
    if (agency.city) cityState.push(agency.city.trim());
    if (agency.state) cityState.push(agency.state.trim());
    const cityStateLine = cityState.join(", ");
    const locality = [cityStateLine, agency.zip_code?.trim()].filter(Boolean).join(" ").trim();
    if (locality) {
      segments.push(locality);
    }
    const formatted = segments.filter(Boolean).join(", ");
    if (formatted) {
      return formatted;
    }
  }
  const cleanedFallback = fallback?.trim();
  return cleanedFallback && cleanedFallback.length > 0 ? cleanedFallback : null;
}

export default function AgentDetailPage() {
  const params = useParams();
  const { id: agentId } = params as Params;
  const router = useRouter();
  const { data: agent, isLoading } = useAgentById(agentId);
  const deleteAgent = useDeleteAgent();
  const sendPortalLink = useSendAgentPortalLink();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">Loading agent...</div>
    );
  }

  if (!agent) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Agent Not Found</h1>
        <p className="text-muted-foreground">We couldn&apos;t locate that agent record.</p>
      </div>
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

  const hasPortalAccess = Boolean(agent.magic_link_token && agent.magic_link_expires_at && new Date(agent.magic_link_expires_at) > new Date());
  const agentCode = formatAgentCode(agent.id);
  const partnerSince = agent.created_at ? formatTimestamp(agent.created_at) : null;

  const handleDelete = () => {
    deleteAgent.mutate(agent.id, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          predicate: (query) => {
            return isAgentsQueryKey(query.queryKey);
          },
        });
        toast.success("Agent deleted");
        router.push("/agents?tab=agents");
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
  const displayedAgencyAddress = agent.agency ? formatAgencyAddress(agent.agency, agent.agency_address) : agent.agency_address?.trim() || null;
  const agencyMapHref = displayedAgencyAddress ? `${MAPS_BASE_URL}${encodeURIComponent(displayedAgencyAddress.replace(/\s+/g, " "))}` : null;

  return (
    <>
    <div className="space-y-6">

      <AdminPageHeader
        title={
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                <AvatarImage src={agent.avatar_url ?? undefined} alt={agent.name} />
                <AvatarFallback>{avatarInitials}</AvatarFallback>
              </Avatar>
              {agent.brand_logo_url && (
                <CompanyLogo
                  name={agent.agency?.name ?? agent.name}
                  logoUrl={agent.brand_logo_url}
                  website={agent.agency?.website ?? undefined}
                  size={64}
                  className="hidden rounded-sm border bg-background p-2 sm:block"
                />
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{agent.name}</h1>
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <Badge color={agent.status === "active" ? "primary" : "light"} className="capitalize">
                    {agent.status}
                  </Badge>
                  <Badge color="light">{agent.agency ? agent.agency.name : "Independent"}</Badge>
                  <Badge color="light" className="capitalize">
                    {agent.preferred_report_format} reports
                  </Badge>
                </div>
              </div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{agentCode}</div>
              {agent.role && <div className="mt-2 text-sm text-muted-foreground">{agent.role}</div>}
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
                <Link href={`/agents/agencies/${agent.agency.id}`}>
                  <Building2 className="mr-2 h-4 w-4" /> View agency
                </Link>
              </Button>
            ) : null}
            <Button className="w-full sm:w-auto" asChild>
              <Link href={`/agents/agents/${agent.id}/edit`}>
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
        <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact information</CardTitle>
                <CardDescription>How your team reaches this agent.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Role</p>
                    <p className="text-sm text-muted-foreground">{agent.role ?? "Not provided"}</p>
                  </div>
                </div>
                <Separator />
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Agency information</CardTitle>
                <CardDescription>The brokerage connected to this agent.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {agent.agency ? (
                  <>
                    <div className="flex items-center gap-3">
                      {agent.brand_logo_url && (
                        <CompanyLogo
                          name={agent.agency.name}
                          logoUrl={agent.brand_logo_url}
                          website={agent.agency.website ?? undefined}
                          size={48}
                          className="rounded-sm border bg-background p-2"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2 font-medium">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <Link href={`/agents/agencies/${agent.agency.id}`} className="hover:underline">
                            {agent.agency.name}
                          </Link>
                        </div>
                        {agent.agency.email && <p className="text-muted-foreground">{agent.agency.email}</p>}
                      </div>
                    </div>
                    {displayedAgencyAddress &&
                      (agencyMapHref ? (
                        <a
                          href={agencyMapHref}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                        >
                          <MapPin className="h-4 w-4 text-sky-600" />
                          <span className="leading-snug whitespace-pre-line">{displayedAgencyAddress}</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <MapPin className="h-4 w-4 text-sky-600" />
                          <span className="leading-snug whitespace-pre-line">{displayedAgencyAddress}</span>
                        </div>
                      ))}
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/agents/agencies/${agent.agency.id}`}>Open agency</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground">This agent operates independently.</p>
                    {displayedAgencyAddress &&
                      (agencyMapHref ? (
                        <a
                          href={agencyMapHref}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                        >
                          <MapPin className="h-4 w-4 text-sky-600" />
                          <span className="leading-snug whitespace-pre-line">{displayedAgencyAddress}</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <MapPin className="h-4 w-4 text-sky-600" />
                          <span className="leading-snug whitespace-pre-line">{displayedAgencyAddress}</span>
                        </div>
                      ))}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Report delivery</CardTitle>
                <CardDescription>How they prefer final files.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Preferred format</p>
                    <p className="text-sm font-medium capitalize">{agent.preferred_report_format}</p>
                  </div>
                </div>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-muted-foreground" /> Overview
            </CardTitle>
            <CardDescription>Performance metrics for this agent.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-sm border p-4">
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
              <div key={row.label} className="flex items-start justify-between gap-4 rounded-sm border p-3">
                <div>
                  <p className="font-medium">{row.label}</p>
                  <p className="text-sm text-muted-foreground">{row.description}</p>
                </div>
                <Badge color="light">{row.enabled ? "On" : "Off"}</Badge>
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
                  <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-sm border p-3 text-sm">
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
    </>
  );
}
