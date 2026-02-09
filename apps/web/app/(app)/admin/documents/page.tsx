"use client";

import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload } from "lucide-react";
import { mockAdminUser } from "@inspectos/shared/constants/mock-users";

export default function DocumentsPage() {
  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Documents"
          description="Store reports, agreements, and internal files"
          actions={
            <Button className="sm:w-auto">
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>Document Library</CardTitle>
            <CardDescription>Organize templates, signed agreements, and attachments.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">No documents yet</p>
                <p className="text-xs text-muted-foreground">
                  Upload signed agreements, reports, and internal documentation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
