"use client";

import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, PhoneCall, Bell, ShieldCheck, AlertTriangle } from "lucide-react";
import { mockAdminUser } from "@/lib/constants/mock-users";

export default function CommunicationsPage() {
  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Communications"
          description="Manage messaging channels, templates, and delivery rules"
          actions={
            <Button className="sm:w-auto" variant="outline">
              Configure Channels
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email
              </CardTitle>
              <CardDescription>Sender identity, domains, and templates.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Configure Email
                </Button>
                <Badge variant="secondary">Provider: Unset</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                SMS
              </CardTitle>
              <CardDescription>Text reminders and status updates.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Configure SMS
                </Button>
                <Badge variant="secondary">Provider: Unset</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PhoneCall className="h-4 w-4 text-muted-foreground" />
                Voice
              </CardTitle>
              <CardDescription>Call logging and outbound dialing rules.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Configure Voice
                </Button>
                <Badge variant="secondary">Provider: Unset</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                Preferences
              </CardTitle>
              <CardDescription>Quiet hours and contact policies.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm">
                Configure Preferences
              </Button>
            </CardContent>
          </Card>
        </div>

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
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span>Order created</span>
                <Badge variant="secondary">Email</Badge>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span>Inspection scheduled</span>
                <Badge variant="secondary">SMS</Badge>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span>Report delivered</span>
                <Badge variant="secondary">Email</Badge>
              </div>
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
              <div className="flex items-center justify-center rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No messages sent yet.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
