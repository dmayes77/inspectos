"use client";

import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { mockAdminUser } from "@/lib/constants/mock-users";

export default function IntegrationsPage() {
  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Integrations"
          description="Connect calendars, accounting, and messaging services"
          actions={
            <Button className="sm:w-auto">
              <Settings className="mr-2 h-4 w-4" />
              Connect Integration
            </Button>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>Available Integrations</CardTitle>
            <CardDescription>Sync calendars, QuickBooks, Stripe, and SMS providers.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              No integrations connected. Choose one to start syncing data.
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
