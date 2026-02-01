"use client";

import { useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Sparkles,
  Mail,
  MessageSquare,
  Clock,
  FileText,
  CreditCard,
  CalendarCheck,
  Bell,
  ArrowRight,
  CheckCircle2,
  Webhook,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import { useWebhooks } from "@/hooks/use-webhooks";

type AutomationTemplate = {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  channel: "email" | "sms" | "internal";
  icon: LucideIcon;
  category: "booking" | "inspection" | "payment" | "report";
};

const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: "booking-confirmation",
    name: "Booking Confirmation",
    description: "Send confirmation email when a new order is created",
    trigger: "Order created",
    action: "Send confirmation email to client",
    channel: "email",
    icon: CalendarCheck,
    category: "booking",
  },
  {
    id: "inspection-reminder-24h",
    name: "24-Hour Reminder",
    description: "Send SMS reminder 24 hours before scheduled inspection",
    trigger: "24 hours before inspection",
    action: "Send SMS reminder to client",
    channel: "sms",
    icon: Clock,
    category: "inspection",
  },
  {
    id: "inspection-reminder-1h",
    name: "1-Hour Reminder",
    description: "Send SMS when inspector is on the way",
    trigger: "1 hour before inspection",
    action: "Send 'on the way' SMS to client",
    channel: "sms",
    icon: MessageSquare,
    category: "inspection",
  },
  {
    id: "inspection-complete",
    name: "Inspection Complete",
    description: "Notify client when inspection is finished",
    trigger: "Inspection marked complete",
    action: "Send completion email to client",
    channel: "email",
    icon: CheckCircle2,
    category: "inspection",
  },
  {
    id: "report-delivery",
    name: "Report Delivery",
    description: "Send report link when report is ready",
    trigger: "Report generated",
    action: "Send report email with download link",
    channel: "email",
    icon: FileText,
    category: "report",
  },
  {
    id: "invoice-sent",
    name: "Invoice Notification",
    description: "Send invoice email when order is completed",
    trigger: "Order completed",
    action: "Send invoice email to client",
    channel: "email",
    icon: CreditCard,
    category: "payment",
  },
  {
    id: "payment-reminder",
    name: "Payment Reminder",
    description: "Send reminder 3 days after invoice is due",
    trigger: "Invoice overdue by 3 days",
    action: "Send payment reminder email",
    channel: "email",
    icon: Bell,
    category: "payment",
  },
  {
    id: "agent-notification",
    name: "Agent Report Ready",
    description: "Notify referring agent when report is delivered",
    trigger: "Report delivered to client",
    action: "Send courtesy email to agent",
    channel: "email",
    icon: Mail,
    category: "report",
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  booking: "Booking",
  inspection: "Inspection",
  payment: "Payment",
  report: "Reports",
};

const CHANNEL_COLORS: Record<string, string> = {
  email: "bg-blue-100 text-blue-800",
  sms: "bg-green-100 text-green-800",
  internal: "bg-gray-100 text-gray-800",
};

export default function AutomationsPage() {
  const { data: webhooks = [] } = useWebhooks();
  const [enabledAutomations, setEnabledAutomations] = useState<Set<string>>(
    new Set(["booking-confirmation", "inspection-reminder-24h", "report-delivery"])
  );

  const toggleAutomation = (id: string) => {
    setEnabledAutomations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.success("Automation disabled");
      } else {
        next.add(id);
        toast.success("Automation enabled");
      }
      return next;
    });
  };

  const enabledCount = enabledAutomations.size;
  const categories = [...new Set(AUTOMATION_TEMPLATES.map((t) => t.category))];

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Automations"
          description="Automate scheduling, reminders, and report delivery"
          actions={
            <Button className="sm:w-auto" variant="outline" disabled>
              <Sparkles className="mr-2 h-4 w-4" />
              Custom Automation
            </Button>
          }
        />

        {/* Webhooks Integration Card */}
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500 p-2">
                  <Webhook className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Webhook Integrations</CardTitle>
                  <CardDescription>
                    Connect to Zapier, Make, and custom applications
                  </CardDescription>
                </div>
              </div>
              <Button asChild>
                <Link href="/admin/automations/webhooks">
                  Configure Webhooks
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border bg-white p-3">
                <p className="text-xs text-muted-foreground">Total Webhooks</p>
                <p className="text-2xl font-semibold mt-1">{webhooks.length}</p>
              </div>
              <div className="rounded-lg border bg-white p-3">
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-2xl font-semibold mt-1 text-green-600">
                  {webhooks.filter((w) => w.status === "active").length}
                </p>
              </div>
              <div className="rounded-lg border bg-white p-3">
                <p className="text-xs text-muted-foreground">Event Types</p>
                <p className="text-2xl font-semibold mt-1">14</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>Zapier</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>Make</span>
              </div>
              <div className="flex items-center gap-2">
                <Webhook className="h-4 w-4" />
                <span>Custom APIs</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Active Automations</p>
              <p className="mt-2 text-2xl font-semibold">{enabledCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Available Templates</p>
              <p className="mt-2 text-2xl font-semibold">{AUTOMATION_TEMPLATES.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
              <p className="mt-2 text-2xl font-semibold">
                {enabledCount > 0 ? "Running" : "Paused"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Automation Templates by Category */}
        {categories.map((category) => {
          const templates = AUTOMATION_TEMPLATES.filter((t) => t.category === category);
          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-base">{CATEGORY_LABELS[category]} Automations</CardTitle>
                <CardDescription>
                  {templates.filter((t) => enabledAutomations.has(t.id)).length} of {templates.length} enabled
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {templates.map((template) => {
                  const isEnabled = enabledAutomations.has(template.id);
                  const Icon = template.icon;

                  return (
                    <div
                      key={template.id}
                      className={`flex items-start justify-between gap-4 rounded-lg border p-4 transition-colors ${
                        isEnabled ? "bg-muted/30" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`rounded-lg p-2 ${isEnabled ? "bg-primary/10" : "bg-muted"}`}>
                          <Icon className={`h-4 w-4 ${isEnabled ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{template.name}</p>
                            <Badge variant="secondary" className={CHANNEL_COLORS[template.channel]}>
                              {template.channel.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span className="font-medium">Trigger:</span>
                            <span>{template.trigger}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span>{template.action}</span>
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => toggleAutomation(template.id)}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}

        {/* Custom Automations Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Custom Automations
            </CardTitle>
            <CardDescription>Build custom workflows with triggers, conditions, and actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
              <Sparkles className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Custom workflow builder coming soon</p>
                <p className="text-xs text-muted-foreground">
                  Create complex automations with multiple steps, conditions, and delays
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
