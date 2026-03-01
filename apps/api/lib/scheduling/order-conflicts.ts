import type { SupabaseClient } from "@supabase/supabase-js";

type OrderRow = {
  id: string;
  order_number: string;
  scheduled_time: string | null;
  duration_minutes: number | null;
  status: string;
};

type FindOrderConflictInput = {
  tenantId: string;
  inspectorId: string;
  scheduledDate: string;
  scheduledTime?: string | null;
  durationMinutes?: number | null;
  excludeOrderId?: string;
};

type OrderConflict = {
  id: string;
  orderNumber: string;
  scheduledTime: string;
  durationMinutes: number;
  status: string;
};

const ACTIVE_ORDER_STATUSES = ["pending", "scheduled", "in_progress", "pending_report", "delivered", "completed"];

function parseTimeToMinutes(value?: string | null): number {
  const source = (value && value.trim()) || "09:00";
  const match = source.match(/^(\d{2}):(\d{2})/);
  if (!match) return 9 * 60;
  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 9 * 60;
  return hours * 60 + minutes;
}

function hasOverlap(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA;
}

export async function findOrderSchedulingConflict(
  supabase: SupabaseClient,
  input: FindOrderConflictInput,
): Promise<OrderConflict | null> {
  const { tenantId, inspectorId, scheduledDate, scheduledTime, durationMinutes, excludeOrderId } = input;

  let query = supabase
    .from("orders")
    .select("id, order_number, scheduled_time, duration_minutes, status")
    .eq("tenant_id", tenantId)
    .eq("inspector_id", inspectorId)
    .eq("scheduled_date", scheduledDate)
    .in("status", ACTIVE_ORDER_STATUSES);

  if (excludeOrderId) {
    query = query.neq("id", excludeOrderId);
  }

  const { data: rows, error } = await query;
  if (error || !rows || rows.length === 0) return null;

  const nextStart = parseTimeToMinutes(scheduledTime);
  const nextDuration = durationMinutes && durationMinutes > 0 ? durationMinutes : 120;
  const nextEnd = nextStart + nextDuration;

  const conflict = (rows as OrderRow[]).find((row) => {
    const existingStart = parseTimeToMinutes(row.scheduled_time);
    const existingDuration = row.duration_minutes && row.duration_minutes > 0 ? row.duration_minutes : 120;
    const existingEnd = existingStart + existingDuration;
    return hasOverlap(nextStart, nextEnd, existingStart, existingEnd);
  });

  if (!conflict) return null;

  return {
    id: conflict.id,
    orderNumber: conflict.order_number,
    scheduledTime: conflict.scheduled_time ?? "09:00",
    durationMinutes: conflict.duration_minutes ?? 120,
    status: conflict.status,
  };
}
