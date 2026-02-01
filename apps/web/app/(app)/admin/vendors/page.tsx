"use client";

import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus } from "lucide-react";
import { mockAdminUser } from "@/lib/constants/mock-users";

export default function VendorsPage() {
  // Import vendor logic
  const { data: vendors = [], isLoading } = require("@/hooks/use-vendors").useVendors();
  console.log("Vendors from useVendors:", vendors);
  const router = require("next/navigation").useRouter();

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Vendors"
          description="Manage labs, subcontractors, and supplier relationships"
          actions={
            <Button className="sm:w-auto" onClick={() => router.push("/admin/vendors/new")}>
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
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
                <Building2 className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Loading vendors...</p>
                </div>
              </div>
            ) : vendors.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
                <Building2 className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">No vendors yet</p>
                  <p className="text-xs text-muted-foreground">Add lab partners, repair contractors, and suppliers.</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {vendors.map((vendor) => (
                  <Card key={vendor.id} className="border">
                    <CardHeader>
                      <CardTitle>{vendor.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>Type: {vendor.vendor_type}</div>
                      {vendor.contact && <div>Contact: {vendor.contact}</div>}
                      {vendor.specialties && <div>Specialties: {vendor.specialties}</div>}
                      {vendor.status && <div>Status: {vendor.status}</div>}
                      {vendor.notes && <div>Notes: {vendor.notes}</div>}
                      <Button variant="outline" size="sm" onClick={() => router.push(`/admin/vendors/${vendor.id}`)}>
                        View
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
