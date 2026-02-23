"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import { toast } from "sonner";

const EMAIL_NOTIFICATIONS = [
  { key: "newBooking" as const,          label: "New booking received",         description: "When a client submits a new inspection request" },
  { key: "inspectionComplete" as const,  label: "Inspection completed",         description: "When an inspector marks an inspection as done"   },
  { key: "paymentReceived" as const,     label: "Payment received",             description: "When a client pays an invoice"                  },
  { key: "reportViewed" as const,        label: "Report viewed by client",      description: "When a client opens their inspection report"     },
  { key: "weeklySummary" as const,       label: "Weekly summary",               description: "Digest of bookings, revenue, and activity"       },
];

export default function NotificationsSettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateMutation = useUpdateSettings();

  const [notifications, setNotifications] = useState({
    newBooking: true, inspectionComplete: true, paymentReceived: true,
    reportViewed: false, weeklySummary: true,
  });

  useEffect(() => {
    if (settings) setNotifications(settings.notifications);
  }, [settings]);

  const handleChange = (key: keyof typeof notifications, value: boolean) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    updateMutation.mutate(
      { notifications: updated },
      {
        onSuccess: () => toast.success("Preferences saved"),
        onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to save"),
      }
    );
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Choose which events trigger an email to you</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {EMAIL_NOTIFICATIONS.map(({ key, label, description }, idx) => (
              <li key={key} className={`flex items-center justify-between gap-6 py-4 ${idx === 0 ? "pt-0" : ""}`}>
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
                <Switch
                  id={key}
                  checked={notifications[key]}
                  onCheckedChange={(checked) => handleChange(key, checked)}
                  disabled={updateMutation.isPending}
                />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
