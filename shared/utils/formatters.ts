/**
 * Form value formatters and parsers
 * Utilities for converting between form values and data types
 */

/**
 * Convert boolean to "yes"/"no" string for select inputs
 * 
 * @param value - Boolean value or undefined
 * @returns "yes", "no", or undefined
 */
export function booleanToYesNo(value: boolean | undefined): "yes" | "no" | undefined {
  if (value === undefined || value === null) return undefined;
  return value ? "yes" : "no";
}

/**
 * Convert "yes"/"no" string to boolean
 * 
 * @param value - String value ("yes", "no", or other)
 * @returns Boolean or undefined
 */
export function yesNoToBoolean(value: string | undefined): boolean | undefined {
  if (!value) return undefined;
  if (value === "yes") return true;
  if (value === "no") return false;
  return undefined;
}

/**
 * Convert value to string, handling undefined/null
 * 
 * @param value - Any value
 * @returns String representation or undefined
 */
export function toString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  return String(value);
}

/**
 * Convert value to number, handling undefined/null
 * 
 * @param value - String or number value
 * @returns Number or undefined
 */
export function toNumber(value: string | number | undefined): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isNaN(num) ? undefined : num;
}

/**
 * Format inspection date and time for display
 * 
 * @deprecated Use `formatDateTime` from `@/lib/utils/dates` instead
 * This function is kept for backward compatibility
 * 
 * @param date - Date string (YYYY-MM-DD)
 * @param time - Time string (HH:MM)
 * @returns Formatted date/time string
 */
export function formatInspectionDateTime(date: string, time: string): string {
  if (!date) return "";
  const dateObj = new Date(`${date}T${time || "00:00"}`);
  const dateStr = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  if (!time) return dateStr;
  const timeStr = dateObj.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${dateStr} at ${timeStr}`;
}
