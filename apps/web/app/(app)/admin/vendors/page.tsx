"use client";

import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus } from "lucide-react";
import { mockAdminUser } from "@/lib/constants/mock-users";

export default function VendorsPage() {
  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Vendors"
          description="Manage labs, subcontractors, and supplier relationships"
          actions={
            <Button className="sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>Vendor Directory</CardTitle>
            <CardDescription>Track contacts, services, and contracts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">No vendors yet</p>
                <p className="text-xs text-muted-foreground">
                  Add lab partners, repair contractors, and suppliers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
