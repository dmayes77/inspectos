"use client";

import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flag } from "lucide-react";
import { mockAdminUser } from "@inspectos/shared/constants/mock-users";

export default function CompliancePage() {
  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Compliance"
          description="Audit logs, data retention, and security policies"
          actions={
            <Button className="sm:w-auto" variant="outline">
              <Flag className="mr-2 h-4 w-4" />
              View Audit Log
            </Button>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>Audit Trail</CardTitle>
            <CardDescription>Track sensitive access and system changes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              Audit events will appear here once activity is recorded.
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
