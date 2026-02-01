"use client";

import { useParams, useRouter } from "next/navigation";
import { useVendor, updateVendor } from "@/hooks/use-vendors";
import { VendorForm } from "@/components/vendors/vendor-form";

export default function EditVendorPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: vendor, isLoading } = useVendor(id);

  if (isLoading) return <div>Loading...</div>;
  if (!vendor) return <div>Vendor not found.</div>;

  return (
    <VendorForm
      mode="edit"
      initialData={vendor}
      onSubmit={async (data) => {
        await updateVendor(id, data);
        router.push(`/admin/vendors/${id}`);
      }}
      onCancel={() => router.push(`/admin/vendors/${id}`)}
    />
  );
}
