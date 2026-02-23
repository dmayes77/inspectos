"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function InspectionDetailRedirect() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };

  useEffect(() => {
    // After migration 043, inspections are orders. Treat the id as an order id.
    router.replace(`/app/orders/${id}?tab=inspection`);
  }, [id, router]);

  return (
    <>
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
    </>
  );
}
