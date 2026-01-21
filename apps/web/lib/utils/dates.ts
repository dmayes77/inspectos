import { format, parse, isValid, formatDistanceToNow, isPast, isFuture } from "date-fns";

/**
 * Date utility functions using date-fns
 * Provides consistent date formatting and parsing across the app
 */

/**
 * Format a date string for display
 */
export function formatDate(date: string | Date, formatStr: string = "MMM d, yyyy"): string {
  try {
    const dateObj = typeof date === "string" ? parse(date, "yyyy-MM-dd", new Date()) : date;
    if (!isValid(dateObj)) return String(date);
    return format(dateObj, formatStr);
  } catch {
    return String(date);
  }
}

export function formatDateShort(date: string | Date): string {
  return formatDate(date, "MM-dd-yy");
}

/**
 * Format a time string for display
 */
export function formatTime(time: string, formatStr: string = "h:mm a"): string {
  try {
    const [hours, minutes] = time.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0);
    return format(date, formatStr);
  } catch {
    return time;
  }
}

export function formatTime12(time: string): string {
  return formatTime(time, "h:mm a");
}

/**
 * Format date and time together
 */
export function formatDateTime(date: string, time: string): string {
  try {
    if (!time) {
      return formatDate(date, "MMM d, yyyy");
    }
    const dateObj = parse(`${date} ${time}`, "yyyy-MM-dd HH:mm", new Date());
    if (!isValid(dateObj)) return `${date} at ${time}`;
    return format(dateObj, "MMM d, yyyy 'at' h:mm a");
  } catch {
    return `${date} at ${time}`;
  }
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: string | Date): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (!isValid(dateObj)) return "";
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch {
    return "";
  }
}

/**
 * Check if a date is in the past
 */
export function isDatePast(date: string | Date): boolean {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return isValid(dateObj) && isPast(dateObj);
  } catch {
    return false;
  }
}

/**
 * Check if a date is in the future
 */
export function isDateFuture(date: string | Date): boolean {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return isValid(dateObj) && isFuture(dateObj);
  } catch {
    return false;
  }
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * Get current time in HH:MM format
 */
export function getCurrentTime(): string {
  return format(new Date(), "HH:mm");
}
