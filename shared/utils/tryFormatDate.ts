// Utility to format a date string as 'MMM d, yyyy' (e.g., Jan 29, 2026)
export function tryFormatDate(date?: string | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
