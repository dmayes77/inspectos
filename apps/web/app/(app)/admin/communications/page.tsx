"use client";

import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, PhoneCall, Bell, AlertTriangle, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { useIntegrations } from "@/hooks/use-integrations";

const CHANNEL_CONFIG = [
  {
    type: "email" as const,
    title: "Email",
    description: "Sender identity, domains, and templates.",
    icon: Mail,
  },
  {
    type: "sms" as const,
    title: "SMS",
    description: "Text reminders and status updates.",
    icon: MessageSquare,
  },
];

const DELIVERY_RULES = [
  { trigger: "Order created", channel: "Email", description: "Confirmation sent to client" },
  { trigger: "Inspection scheduled", channel: "SMS", description: "Reminder 24h before" },
  { trigger: "Inspection complete", channel: "Email", description: "Notify client report is ready" },
  { trigger: "Report delivered", channel: "Email", description: "Report link and summary" },
  { trigger: "Payment reminder", channel: "Email", description: "3 days after invoice due" },
];

export default function CommunicationsPage() {
  const { data: integrations = [], isLoading } = useIntegrations();

  const getIntegrationStatus = (type: string) => {
    const integration = integrations.find((i) => i.type === type);
    return integration?.status === "connected" ? integration : null;
  };

  const emailIntegration = getIntegrationStatus("email");
  const smsIntegration = getIntegrationStatus("sms");

  const connectedChannels = [emailIntegration, smsIntegration].filter(Boolean).length;

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Communications"
          description="Manage messaging channels, templates, and delivery rules"
          actions={
            <Button className="sm:w-auto" variant="outline" asChild>
              <Link href="/admin/integrations">
                <ExternalLink className="mr-2 h-4 w-4" />
                Configure Channels
              </Link>
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Connected Channels</p>
              <p className="mt-2 text-2xl font-semibold">{connectedChannels} / 2</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Delivery Rules</p>
              <p className="mt-2 text-2xl font-semibold">{DELIVERY_RULES.length} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
              <p className="mt-2 text-2xl font-semibold">
                {connectedChannels > 0 ? "Ready" : "Setup needed"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Channel Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {CHANNEL_CONFIG.map((channel) => {
              const integration = integrations.find((i) => i.type === channel.type);
              const isConnected = integration?.status === "connected";
              const Icon = channel.icon;

              return (
                <Card key={channel.type}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {channel.title}
                    </CardTitle>
                    <CardDescription>{channel.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isConnected ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not configured</Badge>
                        )}
                        {integration?.provider && (
                          <span className="text-xs text-muted-foreground capitalize">
                            via {integration.provider}
                          </span>
                        )}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/integrations">
                          {isConnected ? "Manage" : "Connect"}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Voice Card - placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PhoneCall className="h-4 w-4 text-muted-foreground" />
                  Voice
                </CardTitle>
                <CardDescription>Call logging and outbound dialing rules.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Coming soon</Badge>
                  <Button variant="outline" size="sm" disabled>
                    Connect
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4 text-muted-foreground" />
                Delivery Rules
              </CardTitle>
              <CardDescription>When messages are sent across the order lifecycle.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {DELIVERY_RULES.map((rule, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div>
                    <span className="font-medium">{rule.trigger}</span>
                    <p className="text-xs text-muted-foreground">{rule.description}</p>
                  </div>
                  <Badge variant="secondary">{rule.channel}</Badge>
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-2">
                Delivery rules are automatically triggered based on order status changes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                Message Log
              </CardTitle>
              <CardDescription>Recent outbound messages and failures.</CardDescription>
            </CardHeader>
            <CardContent>
              {connectedChannels === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  <p>Connect email or SMS to start sending messages.</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/integrations">
                      Configure Integrations
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No messages sent yet. Messages will appear here once orders are processed.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
