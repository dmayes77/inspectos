"use client";

import { useParams } from "next/navigation";
import { BackButton } from "@/components/ui/back-button";
import { AdminShell } from "@/components/layout/admin-shell";
import { OrderForm } from "@/components/orders/order-form";
import { useOrderById } from "@/hooks/use-orders";
import { mockAdminUser } from "@inspectos/shared/constants/mock-users";

export default function EditOrderPage() {
  const params = useParams();
  const orderId = typeof params.id === "string" ? params.id : "";
  const { data: order, isLoading, isError } = useOrderById(orderId);

  if (isLoading) {
    return (
      <AdminShell user={mockAdminUser}>
        <div className="py-12 text-center text-muted-foreground">Loading order...</div>
      </AdminShell>
    );
  }

  if (isError || !order) {
    return (
      <AdminShell user={mockAdminUser}>
        <div className="space-y-6">
          <BackButton href="/admin/orders" label="Back to Orders" variant="ghost" />
          <div className="text-center py-12 text-muted-foreground">Order not found.</div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell user={mockAdminUser}>
      <OrderForm mode="edit" order={order} />
    </AdminShell>
  );
}
