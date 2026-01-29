import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import { useQueryClient } from "@tanstack/react-query";
import {
  fetchOrders,
  fetchOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  type Order,
  type CreateOrderInput,
  type UpdateOrderInput,
  type OrderFilters,
} from "@/lib/data/orders";

export type { Order, CreateOrderInput, UpdateOrderInput, OrderFilters };

export function useOrders(tenantSlug: string = "demo", filters?: OrderFilters) {
  const queryKey = ["orders", tenantSlug, filters ?? null] as const;
  return useGet<Order[]>(queryKey, async () => fetchOrders(tenantSlug, filters));
}

export function useOrderById(orderId: string) {
  return useGet<Order | null>(
    `order-${orderId}`,
    async () => {
      try {
        return await fetchOrderById(orderId);
      } catch {
        return null;
      }
    },
    { enabled: !!orderId },
  );
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return usePost<Order, CreateOrderInput>("orders", async (data) => createOrder(data), {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspections"] });
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return usePut<Order, UpdateOrderInput>("orders", async (data) => updateOrder(data), {
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ["inspections"] });
      if (updatedOrder?.id) {
        queryClient.invalidateQueries({ queryKey: [`order-${updatedOrder.id}`] });
      }
    },
  });
}

export function useDeleteOrder() {
  return useDelete<boolean>("orders", async (id: string) => deleteOrder(id));
}
