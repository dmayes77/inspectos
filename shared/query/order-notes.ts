export const orderNotesQueryKeys = {
  all: ["order-notes"] as const,
  list: (orderId: string) => ["order-notes", orderId] as const,
};
