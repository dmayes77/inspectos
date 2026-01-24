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

export async function fetchOrderNotes(orderId: string): Promise<OrderNote[]> {
  const response = await fetch(`/api/admin/orders/${orderId}/notes`, {
    cache: "no-store",
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error?.message || "Failed to load order notes.");
  }
  const result = await response.json();
  return result?.data ?? [];
}

export async function createOrderNote(input: CreateOrderNoteInput): Promise<OrderNote> {
  const response = await fetch(`/api/admin/orders/${input.orderId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note_type: input.noteType, body: input.body }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error?.message || "Failed to save note.");
  }
  const result = await response.json();
  return result?.data as OrderNote;
}
