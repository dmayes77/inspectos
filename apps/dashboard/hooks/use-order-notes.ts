import { useGet, usePost } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";

export type OrderNoteType = "internal" | "client";

export interface OrderNote {
  id: string;
  order_id: string;
  tenant_id: string;
  note_type: OrderNoteType;
  body: string;
  created_at: string;
  created_by: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

export interface CreateOrderNoteInput {
  orderId: string;
  noteType: OrderNoteType;
  body: string;
}

export function useOrderNotes(orderId: string) {
  const apiClient = useApiClient();
  return useGet<OrderNote[]>(
    `order-notes-${orderId}`,
    async () => {
      return await apiClient.get<OrderNote[]>(`/admin/orders/${orderId}/notes`);
    },
    { enabled: !!orderId }
  );
}

export function useCreateOrderNote(orderId: string) {
  const apiClient = useApiClient();
  return usePost<OrderNote, CreateOrderNoteInput>(
    `order-notes-${orderId}`,
    async (input) => {
      return await apiClient.post<OrderNote>(`/admin/orders/${input.orderId}/notes`, {
        note_type: input.noteType,
        body: input.body,
      });
    }
  );
}
