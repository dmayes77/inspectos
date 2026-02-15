"use client";

import { useParams } from "next/navigation";
import { OrderForm } from "@/components/orders/order-form";
import { useOrderById } from "@/hooks/use-orders";

export default function EditOrderPage() {
  const params = useParams();
  const orderId = typeof params.id === "string" ? params.id : "";
  const { data: order, isLoading, isError } = useOrderById(orderId);

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">Loading order...</div>
    );
  }

  if (isError || !order) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 text-muted-foreground">Order not found.</div>
      </div>
    );
  }

  return (
    <OrderForm mode="edit" order={order} />
  );
}
