"use client";

import { useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useVendor, useUpdateVendor } from "@/hooks/use-vendors";
import { VendorForm } from "@/components/vendors/vendor-form";
import { toSlugIdSegment } from "@/lib/routing/slug-id";

export default function EditVendorPage() {
  const { id } = useParams() as { id: string };
  const pathname = usePathname();
  const router = useRouter();
  const { data: vendor, isLoading } = useVendor(id);
  const updateVendor = useUpdateVendor();

  useEffect(() => {
    if (pathname.endsWith("/edit")) {
      router.replace(pathname.slice(0, -5));
    }
  }, [pathname, router]);

  if (pathname.endsWith("/edit")) {
    return null;
  }

  if (isLoading) return <div>Loading...</div>;
  if (!vendor) return <div>Vendor not found.</div>;

  return (
    <VendorForm
      mode="edit"
      initialData={vendor}
      onSubmit={async (data) => {
        await updateVendor.mutateAsync({ id: vendor.id, ...data });
        router.push(`/vendors/${toSlugIdSegment(vendor.name, vendor.publicId)}`);
      }}
      onCancel={() => router.push(`/vendors/${toSlugIdSegment(vendor.name, vendor.publicId)}`)}
    />
  );
}
