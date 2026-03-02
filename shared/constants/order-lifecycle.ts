export const ORDER_STATUSES = [
  "pending",
  "scheduled",
  "in_progress",
  "pending_report",
  "delivered",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["scheduled", "cancelled"],
  scheduled: ["pending", "in_progress", "cancelled"],
  in_progress: ["pending_report", "cancelled"],
  pending_report: ["delivered", "completed"],
  delivered: ["completed"],
  completed: [],
  cancelled: [],
};

export const STATUS_REQUIRES_SCHEDULE: ReadonlySet<OrderStatus> = new Set([
  "scheduled",
  "in_progress",
  "pending_report",
  "delivered",
  "completed",
]);

export function getAllowedNextOrderStatuses(currentStatus: OrderStatus): readonly OrderStatus[] {
  return ORDER_STATUS_TRANSITIONS[currentStatus];
}

export function isOrderStatusTransitionAllowed(fromStatus: OrderStatus, toStatus: OrderStatus): boolean {
  if (fromStatus === toStatus) return true;
  return ORDER_STATUS_TRANSITIONS[fromStatus].includes(toStatus);
}
