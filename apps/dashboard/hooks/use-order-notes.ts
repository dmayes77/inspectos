import { useGet, usePost } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";
import { createOrderNotesApi } from "@inspectos/shared/api";
import { orderNotesQueryKeys } from "@inspectos/shared/query";

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
  const orderNotesApi = createOrderNotesApi(apiClient);
  return useGet<OrderNote[]>(
    orderNotesQueryKeys.list(orderId),
    async () => {
      return await orderNotesApi.list<OrderNote>(orderId);
    },
    { enabled: !!orderId }
  );
}

export function useCreateOrderNote(orderId: string) {
  const apiClient = useApiClient();
  const orderNotesApi = createOrderNotesApi(apiClient);
  return usePost<OrderNote, CreateOrderNoteInput>(
    orderNotesQueryKeys.list(orderId),
    async (input) => {
      return await orderNotesApi.create<OrderNote>(input.orderId, input.noteType, input.body);
    }
  );
}
