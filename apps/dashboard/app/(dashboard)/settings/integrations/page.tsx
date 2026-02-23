"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Mail, Phone, CreditCard, FileText, Users, Calendar, CheckCircle2, XCircle, Loader2 } from "lucide-react";
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
  { type: "email",      title: "Email",      description: "Send transactional email and reports.",      icon: Mail,       providers: [{ value: "sendgrid", label: "SendGrid" }, { value: "mailgun", label: "Mailgun" }, { value: "ses", label: "Amazon SES" }] },
  { type: "sms",        title: "Phone & SMS", description: "Text reminders and call forwarding.",       icon: Phone,      providers: [{ value: "twilio", label: "Twilio" }, { value: "bandwidth", label: "Bandwidth" }] },
  { type: "payments",   title: "Payments",    description: "Stripe, Square, or ACH processing.",        icon: CreditCard, providers: [{ value: "stripe", label: "Stripe" }, { value: "square", label: "Square" }] },
  { type: "accounting", title: "Accounting",  description: "QuickBooks or Xero export.",                icon: FileText,   providers: [{ value: "quickbooks", label: "QuickBooks" }, { value: "xero", label: "Xero" }] },
  { type: "payroll",    title: "Payroll",     description: "Send payouts to payroll systems.",          icon: Users,      providers: [{ value: "gusto", label: "Gusto" }, { value: "adp", label: "ADP" }] },
  { type: "calendar",   title: "Calendar",    description: "Sync with Google or Outlook calendars.",   icon: Calendar,   providers: [{ value: "google", label: "Google Calendar" }, { value: "outlook", label: "Microsoft Outlook" }] },
];

function StatusBadge({ status }: { status?: string }) {
  if (status === "connected") return <Badge color="light" className="bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400"><CheckCircle2 className="mr-1 h-3 w-3" />Connected</Badge>;
  if (status === "error")     return <Badge color="light" className="bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400"><XCircle className="mr-1 h-3 w-3" />Error</Badge>;
  if (status === "pending")   return <Badge color="light" className="bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Pending</Badge>;
  return <Badge color="light">Not connected</Badge>;
}

export default function IntegrationsSettingsPage() {
  const { data: integrations = [], isLoading } = useIntegrations();
  const connectMutation = useConnectIntegration();
  const disconnectMutation = useDisconnectIntegration();

  const [showDialog, setShowDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<IntegrationType | null>(null);
  const [selectedProvider, setSelectedProvider] = useState("");

  const getByType = (type: IntegrationType) => integrations.find((i) => i.type === type);

  const handleConnect = (type: IntegrationType) => { setSelectedType(type); setSelectedProvider(""); setShowDialog(true); };
  const handleDisconnect = (id: string, title: string) => {
    disconnectMutation.mutate(id, {
      onSuccess: () => toast.success(`${title} disconnected`),
      onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to disconnect"),
    });
  };
  const handleConfirmConnect = () => {
    if (!selectedType || !selectedProvider) { toast.error("Select a provider"); return; }
    connectMutation.mutate(
      { type: selectedType, provider: selectedProvider },
      {
        onSuccess: () => { toast.success("Integration connected"); setShowDialog(false); setSelectedType(null); setSelectedProvider(""); },
        onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to connect"),
      }
    );
  };

  const selectedDef = selectedType ? INTEGRATION_DEFINITIONS.find((d) => d.type === selectedType) : null;
  const connectedCount = integrations.filter((i) => i.status === "connected").length;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Connected" value={connectedCount} />
        <StatCard label="Available" value={INTEGRATION_DEFINITIONS.length} />
        <StatCard label="Status" value={connectedCount > 0 ? "Active" : "Setup needed"} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading integrations…
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {INTEGRATION_DEFINITIONS.map((def) => {
            const integration = getByType(def.type);
            const isConnected = integration?.status === "connected";
            const Icon = def.icon;
            return (
              <Card key={def.type}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Icon className="h-4 w-4" />{def.title}
                    </CardTitle>
                    <CardDescription>{def.description}</CardDescription>
                  </div>
                  {isConnected ? (
                    <Button variant="outline" onClick={() => handleDisconnect(integration.id, def.title)} disabled={disconnectMutation.isPending}>
                      Disconnect
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => handleConnect(def.type)}>Connect</Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <StatusBadge status={integration?.status} />
                    {integration?.provider && <span className="text-xs text-muted-foreground capitalize">{integration.provider}</span>}
                  </div>
                  {integration?.connected_at && <p className="mt-2 text-xs text-muted-foreground">Connected {new Date(integration.connected_at).toLocaleDateString()}</p>}
                  {integration?.error_message && <p className="mt-2 text-xs text-red-600">{integration.error_message}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {selectedDef?.title}</DialogTitle>
            <DialogDescription>Select a provider for your {selectedDef?.title.toLowerCase()} integration.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger><SelectValue placeholder="Select a provider" /></SelectTrigger>
                <SelectContent>
                  {selectedDef?.providers.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">Full OAuth configuration will be implemented in production.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleConfirmConnect} disabled={connectMutation.isPending || !selectedProvider}>
              {connectMutation.isPending ? "Connecting…" : "Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Business SMTP</CardTitle>
          <CardDescription>
            Configure tenant-owned SMTP credentials for outbound business notifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/settings/integrations/smtp">Open SMTP settings</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
