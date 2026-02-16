"use client";

import { useRouter } from "next/navigation";
import { VendorForm } from "@/components/vendors/vendor-form";
import { useCreateVendor } from "@/hooks/use-vendors";

export default function NewVendorPage() {
  const router = useRouter();
  const createVendor = useCreateVendor();

  return (
    <VendorForm
      mode="new"
      initialData={undefined}
      onSubmit={async (data) => {
        await createVendor.mutateAsync(data);
        router.push("/admin/vendors");
      }}
      onCancel={() => router.push("/admin/vendors")}
    />
  );
}
