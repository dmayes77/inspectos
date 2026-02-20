"use client";

import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus } from "lucide-react";
import { useVendors, type Vendor } from "@/hooks/use-vendors";

export default function VendorsPage() {
  const { data: vendors = [], isLoading } = useVendors();
  const router = useRouter();

  return (
    <>
    <div className="space-y-6">
      <AdminPageHeader
        title="Vendors"
        description="Manage labs, subcontractors, and supplier relationships"
        actions={
          <Button className="sm:w-auto" onClick={() => router.push("/app/vendors/new")}>
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
              {vendors.map((vendor: Vendor) => (
                <Card key={vendor.id} className="border">
                  <CardHeader>
                    <CardTitle>{vendor.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {vendor.vendorType && <div>Type: {vendor.vendorType}</div>}
                    {vendor.email && <div>Email: {vendor.email}</div>}
                    {vendor.phone && <div>Phone: {vendor.phone}</div>}
                    {vendor.status && <div>Status: {vendor.status}</div>}
                    <Button variant="outline" onClick={() => router.push(`/app/vendors/${vendor.id}`)}>
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
    </>
  );
}
