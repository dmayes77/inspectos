"use client";

import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus } from "lucide-react";
import { mockAdminUser } from "@/lib/constants/mock-users";

export default function AutomationsPage() {
  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Automations"
          description="Automate scheduling, reminders, and report delivery"
          actions={
            <Button className="sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              New Automation
            </Button>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>Workflow Builder</CardTitle>
            <CardDescription>Trigger emails, texts, and tasks automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
              <Sparkles className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Automations are empty</p>
                <p className="text-xs text-muted-foreground">
                  Build flows for booking confirmations, reminders, and report delivery.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
