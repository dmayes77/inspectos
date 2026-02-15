"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useInspectionData } from "@/hooks/use-inspection-data";

export default function InspectionDetailRedirect() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };

  const { data: inspectionData, isLoading } = useInspectionData(id);

  useEffect(() => {
    const orderId = inspectionData?.inspection?.order?.id;
    if (orderId) {
      router.replace(`/admin/orders/${orderId}?tab=inspection`);
    }
  }, [inspectionData, router]);

  if (!isLoading && !inspectionData?.inspection?.order?.id) {
    router.replace("/admin/orders");
  }

  return (
    <>
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
    </>
  );
}
