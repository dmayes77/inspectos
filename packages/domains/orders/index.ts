export type OrderStatusTone = "is-completed" | "is-in-progress" | "is-pending" | "is-default";
export * from "./inspection-transition";

export type OrderInspectionWorkflowState =
  | "not_assigned"
  | "assigned"
  | "arrived"
  | "in_progress"
  | "paused"
  | "waiting_for_info"
  | "uploading"
  | "ready_for_review"
  | "corrections_required"
  | "completed";

type OrderScheduleFormatOptions = {
  includeWeekday?: boolean;
  includeYear?: boolean;
  includeOnPrefix?: boolean;
  unscheduledLabel?: string;
  locale?: Intl.LocalesArgument;
};

const FALLBACK_SHORT_DATE_LABEL = "---";

export function getOrderStatusTone(status?: string | null): OrderStatusTone {
  const normalized = (status ?? "").trim().toLowerCase();
  if (normalized === "completed" || normalized === "submitted") return "is-completed";
  if (normalized === "in_progress") return "is-in-progress";
  if (normalized === "pending") return "is-pending";
  return "is-default";
}

export function formatOrderStatusLabel(status?: string | null, fallback = "Active"): string {
  const normalized = (status ?? "").trim();
  if (!normalized) return fallback;
  return normalized
    .split("_")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function formatOrderScheduleFriendly(
  scheduledDate?: string | null,
  scheduledTime?: string | null,
  options: OrderScheduleFormatOptions = {}
): string {
  const {
    includeWeekday = false,
    includeYear = false,
    includeOnPrefix = false,
    unscheduledLabel = "Unscheduled",
    locale,
  } = options;

  if (!scheduledDate) return unscheduledLabel;

  const parsedDate = parseOrderDateTime(scheduledDate, scheduledTime);
  if (!parsedDate) {
    return [scheduledDate, scheduledTime].filter(Boolean).join(" ");
  }

  const dateFormatOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };

  if (includeWeekday) {
    dateFormatOptions.weekday = "long";
  }

  if (includeYear) {
    dateFormatOptions.year = "numeric";
  }

  const datePart = new Intl.DateTimeFormat(locale, dateFormatOptions).format(parsedDate);
  if (!scheduledTime) return datePart;

  const timePart = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  }).format(parsedDate);

  if (includeOnPrefix) {
    return `on ${datePart} at ${timePart}`;
  }

  return `${datePart} at ${timePart}`;
}

export function formatOrderShortDate(scheduledDate?: string | null, locale?: Intl.LocalesArgument): string {
  if (!scheduledDate) return FALLBACK_SHORT_DATE_LABEL;

  const parsedDate = parseOrderDateTime(scheduledDate);
  if (!parsedDate) return scheduledDate;

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(parsedDate);
}

export function deriveInitialInspectionWorkflowState(
  orderStatus?: string | null,
  hasStarted?: boolean
): OrderInspectionWorkflowState {
  const normalized = (orderStatus ?? "").trim().toLowerCase();
  if (normalized === "completed" || normalized === "submitted") return "completed";
  if (normalized === "in_progress") return "in_progress";
  if (hasStarted) return "in_progress";
  return "assigned";
}

function parseOrderDateTime(scheduledDate: string, scheduledTime?: string | null): Date | null {
  const [yearRaw, monthRaw, dayRaw] = scheduledDate.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  let hours = 0;
  let minutes = 0;

  if (scheduledTime) {
    const [hoursRaw, minutesRaw] = scheduledTime.split(":");
    hours = Number(hoursRaw);
    minutes = Number(minutesRaw);
  }

  const parsedDate = new Date(year, month - 1, day, hours, minutes);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}
