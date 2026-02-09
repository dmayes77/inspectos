"use client";

import { useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Mail, Phone, CreditCard, FileText, Users, Calendar, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { mockAdminUser } from "@inspectos/shared/constants/mock-users";
import { useIntegrations, useConnectIntegration, useDisconnectIntegration, type IntegrationType } from "@/hooks/use-integrations";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";

type IntegrationDefinition = {
  type: IntegrationType;
  title: string;
  description: string;
  icon: LucideIcon;
  providers: { value: string; label: string }[];
};

const INTEGRATION_DEFINITIONS: IntegrationDefinition[] = [
  {
    type: "email",
    title: "Email",
    description: "Send transactional email and reports.",
    icon: Mail,
    providers: [
      { value: "sendgrid", label: "SendGrid" },
      { value: "mailgun", label: "Mailgun" },
      { value: "ses", label: "Amazon SES" },
    ],
  },
  {
    type: "sms",
    title: "Phone & SMS",
    description: "Text reminders and call forwarding.",
    icon: Phone,
    providers: [
      { value: "twilio", label: "Twilio" },
      { value: "bandwidth", label: "Bandwidth" },
    ],
  },
  {
    type: "payments",
    title: "Payments",
    description: "Stripe, Square, or ACH processing.",
    icon: CreditCard,
    providers: [
      { value: "stripe", label: "Stripe" },
      { value: "square", label: "Square" },
    ],
  },
  {
    type: "accounting",
    title: "Accounting",
    description: "QuickBooks or Xero export.",
    icon: FileText,
    providers: [
      { value: "quickbooks", label: "QuickBooks" },
      { value: "xero", label: "Xero" },
    ],
  },
  {
    type: "payroll",
    title: "Payroll",
    description: "Send payouts to payroll systems.",
    icon: Users,
    providers: [
      { value: "gusto", label: "Gusto" },
      { value: "adp", label: "ADP" },
    ],
  },
  {
    type: "calendar",
    title: "Calendar",
    description: "Sync with Google or Outlook calendars.",
    icon: Calendar,
    providers: [
      { value: "google", label: "Google Calendar" },
      { value: "outlook", label: "Microsoft Outlook" },
    ],
  },
];

function getStatusBadge(status: string | undefined) {
  switch (status) {
    case "connected":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Connected
        </Badge>
      );
    case "error":
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          <XCircle className="mr-1 h-3 w-3" />
          Error
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          Pending
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          Not connected
        </Badge>
      );
  }
}

export default function IntegrationsPage() {
  const { data: integrations = [], isLoading } = useIntegrations();
  const connectMutation = useConnectIntegration();
  const disconnectMutation = useDisconnectIntegration();

  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<IntegrationType | null>(null);
  const [selectedProvider, setSelectedProvider] = useState("");

  const getIntegrationByType = (type: IntegrationType) => {
    return integrations.find((i) => i.type === type);
  };

  const handleConnect = (type: IntegrationType) => {
    setSelectedType(type);
    setSelectedProvider("");
    setShowConnectDialog(true);
  };

  const handleDisconnect = (integrationId: string, type: string) => {
    disconnectMutation.mutate(integrationId, {
      onSuccess: () => {
        toast.success(`${type} disconnected`);
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to disconnect");
      },
    });
  };

  const handleConfirmConnect = () => {
    if (!selectedType || !selectedProvider) {
      toast.error("Please select a provider");
      return;
    }

    connectMutation.mutate(
      { type: selectedType, provider: selectedProvider },
      {
        onSuccess: () => {
          toast.success("Integration connected successfully");
          setShowConnectDialog(false);
          setSelectedType(null);
          setSelectedProvider("");
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to connect");
        },
      }
    );
  };

  const selectedDefinition = selectedType
    ? INTEGRATION_DEFINITIONS.find((d) => d.type === selectedType)
    : null;

  const connectedCount = integrations.filter((i) => i.status === "connected").length;

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Integrations"
          description="Connect calendars, accounting, and messaging services"
        />

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Connected</p>
              <p className="mt-2 text-2xl font-semibold">{connectedCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Available</p>
              <p className="mt-2 text-2xl font-semibold">{INTEGRATION_DEFINITIONS.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
              <p className="mt-2 text-2xl font-semibold">
                {connectedCount > 0 ? "Active" : "Setup needed"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Integration Cards */}
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">Loading integrations...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {INTEGRATION_DEFINITIONS.map((definition) => {
              const integration = getIntegrationByType(definition.type);
              const isConnected = integration?.status === "connected";
              const Icon = definition.icon;

              return (
                <Card key={definition.type}>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {definition.title}
                      </CardTitle>
                      <CardDescription>{definition.description}</CardDescription>
                    </div>
                    {isConnected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(integration.id, definition.title)}
                        disabled={disconnectMutation.isPending}
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConnect(definition.type)}
                      >
                        Connect
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      {getStatusBadge(integration?.status)}
                      {integration?.provider && (
                        <span className="text-xs text-muted-foreground capitalize">
                          {integration.provider}
                        </span>
                      )}
                    </div>
                    {integration?.connected_at && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Connected {new Date(integration.connected_at).toLocaleDateString()}
                      </p>
                    )}
                    {integration?.error_message && (
                      <p className="mt-2 text-xs text-red-600">{integration.error_message}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Connect Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {selectedDefinition?.title}</DialogTitle>
            <DialogDescription>
              Select a provider to connect your {selectedDefinition?.title.toLowerCase()} integration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {selectedDefinition?.providers.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Note: Full OAuth configuration would be implemented here in production.
              For now, this marks the integration as connected.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmConnect} disabled={connectMutation.isPending || !selectedProvider}>
              {connectMutation.isPending ? "Connecting..." : "Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
