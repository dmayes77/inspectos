"use client";

import { useParams, useRouter } from "next/navigation";
import { useVendor, useDeleteVendor } from "@/hooks/use-vendors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VendorDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: vendor, isLoading } = useVendor(id);
  const { mutate: deleteVendor } = useDeleteVendor();

  if (isLoading) return <div>Loading...</div>;
  if (!vendor) return <div>Vendor not found.</div>;

  return (
    <>
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{vendor.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {vendor.vendorType && <div>Type: {vendor.vendorType}</div>}
          {vendor.phone && <div>Phone: {vendor.phone}</div>}
          {vendor.email && <div>Email: {vendor.email}</div>}
          {vendor.status && <div>Status: {vendor.status}</div>}
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Button onClick={() => router.push(`/app/vendors/${id}/edit`)} variant="outline">
          Edit
        </Button>
        <Button
          onClick={() => {
            deleteVendor(id, {
              onSuccess: () => router.push("/app/vendors")
            });
          }}
          variant="destructive"
        >
          Delete
        </Button>
        <Button onClick={() => router.push("/app/vendors")} variant="ghost">
          Back
        </Button>
      </div>
    </div>
    </>
  );
}
