"use client";

import { useRouter } from "next/navigation";
import { VendorForm } from "@/components/vendors/vendor-form";
import { createVendor } from "@/hooks/use-vendors";

export default function NewVendorPage() {
  const router = useRouter();

  return (
    <VendorForm
      mode="new"
      onSubmit={async (data) => {
        await createVendor(data);
        router.push("/admin/vendors");
      }}
      onCancel={() => router.push("/admin/vendors")}
    />
  );
}
