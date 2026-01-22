import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
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
  return useGet<Order[]>(
    `orders-${tenantSlug}-${JSON.stringify(filters ?? {})}`,
    async () => fetchOrders(tenantSlug, filters)
  );
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
    { enabled: !!orderId }
  );
}

export function useCreateOrder() {
  return usePost<Order, CreateOrderInput>("orders", async (data) => createOrder(data));
}

export function useUpdateOrder() {
  return usePut<Order, UpdateOrderInput>("orders", async (data) => updateOrder(data));
}

export function useDeleteOrder() {
  return useDelete<boolean>("orders", async (id: string) => deleteOrder(id));
}
