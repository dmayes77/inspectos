"use client";

import { useParams, useRouter } from "next/navigation";
import { useVendor, useUpdateVendor } from "@/hooks/use-vendors";
import { VendorForm } from "@/components/vendors/vendor-form";

export default function EditVendorPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: vendor, isLoading } = useVendor(id);
  const updateVendor = useUpdateVendor();

  if (isLoading) return <div>Loading...</div>;
  if (!vendor) return <div>Vendor not found.</div>;

  return (
    <VendorForm
      mode="edit"
      initialData={vendor}
      onSubmit={async (data) => {
        await updateVendor.mutateAsync({ id, ...data });
        router.push(`/app/vendors/${id}`);
      }}
      onCancel={() => router.push(`/app/vendors/${id}`)}
    />
  );
}
