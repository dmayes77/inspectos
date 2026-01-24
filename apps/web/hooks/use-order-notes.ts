import { useGet, usePost } from "@/hooks/crud";
import {
  fetchOrderNotes,
  createOrderNote,
  type OrderNote,
  type CreateOrderNoteInput,
} from "@/lib/data/order-notes";

export type { OrderNote, CreateOrderNoteInput };

export function useOrderNotes(orderId: string) {
  return useGet<OrderNote[]>(
    `order-notes-${orderId}`,
    async () => fetchOrderNotes(orderId),
    { enabled: !!orderId }
  );
}

export function useCreateOrderNote(orderId: string) {
  return usePost<OrderNote, CreateOrderNoteInput>(
    `order-notes-${orderId}`,
    async (input) => createOrderNote(input)
  );
}
