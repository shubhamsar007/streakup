/**
 * Shared date utilities for streak calculations.
 * All dates in the streak engine are UTC midnight Date objects
 * representing local calendar dates.
 */

/** Parse YYYY-MM-DD → UTC midnight Date */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!));
}

/** Format UTC midnight Date → YYYY-MM-DD */
export function formatLocalDate(date: Date): string {
  return date.toISOString().split("T")[0]!;
}

/** Add N days to a UTC midnight Date */
export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

/** Returns 1=Mon … 7=Sun (ISO weekday) */
export function isoWeekday(date: Date): number {
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}

/** Compare two UTC-midnight dates by value */
export function dateLte(a: Date, b: Date): boolean {
  return a.getTime() <= b.getTime();
}
export function dateGte(a: Date, b: Date): boolean {
  return a.getTime() >= b.getTime();
}
export function dateEq(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

/** Get today as a UTC midnight date from an IANA timezone string */
export function getTodayUTC(timezone: string): Date {
  try {
    const str = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    return parseLocalDate(str);
  } catch {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
}
