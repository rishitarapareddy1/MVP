// Display-only formatting. Money is stored as integer cents and dates in UTC;
// convert only at render time (spec section 11).

export const DISPLAY_TIME_ZONE = "America/Chicago";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** 12345 -> "$123.45" */
export function formatCents(cents: number): string {
  return usd.format(cents / 100);
}

/** Formats a UTC timestamp as a Chicago-local date, e.g. "Sep 28, 2026". */
export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    dateStyle: "medium",
  }).format(new Date(value));
}

/** Formats a UTC timestamp as Chicago-local date and time, e.g. "Sep 28, 2026, 5:00 PM". */
export function formatDateTime(value: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/** Today's date in Chicago as "YYYY-MM-DD" (for <input type="date" min>). */
export function todayInChicago(now: Date = new Date()): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: DISPLAY_TIME_ZONE }).format(now);
}

/** Formats a date-only value ("2026-10-15") without shifting it across time zones. */
export function formatDateOnly(value: string): string {
  // Date-only strings parse as UTC midnight, so format them in UTC too.
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", dateStyle: "medium" }).format(
    new Date(value),
  );
}
