"use client";

import { useParams, useRouter } from "next/navigation";
import { useVendor, deleteVendor } from "@/hooks/use-vendors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VendorDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: vendor, isLoading } = useVendor(id);

  if (isLoading) return <div>Loading...</div>;
  if (!vendor) return <div>Vendor not found.</div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{vendor.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>Type: {vendor.type}</div>
          <div>Contact: {vendor.contact}</div>
          <div>Specialties: {vendor.specialties}</div>
          <div>Status: {vendor.status}</div>
          <div>Notes: {vendor.notes}</div>
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Button onClick={() => router.push(`/admin/vendors/${id}/edit`)} variant="outline">
          Edit
        </Button>
        <Button
          onClick={async () => {
            await deleteVendor(id);
            router.push("/admin/vendors");
          }}
          variant="destructive"
        >
          Delete
        </Button>
        <Button onClick={() => router.push("/admin/vendors")} variant="ghost">
          Back
        </Button>
      </div>
    </div>
  );
}
