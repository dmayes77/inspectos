"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/layout/admin-shell";
import { OrderForm } from "@/components/orders/order-form";
import { useOrderById } from "@/hooks/use-orders";
import { mockAdminUser } from "@/lib/constants/mock-users";

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
          <Button variant="ghost" asChild>
            <Link href="/admin/orders">
              Back to Orders
            </Link>
          </Button>
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
