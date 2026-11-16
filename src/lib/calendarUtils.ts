/**
 * Pure calendar utility functions — no server or DB dependencies.
 * Safe to import in both server and client components.
 */
import { formatLocalDate, addDays } from "./dateUtils";

/** Map of dateStr (YYYY-MM-DD) → number of habit completions */
export type CalendarData = Record<string, number>;

/**
 * Builds a heatmap grid: array of weeks (columns), each with 7 days (Mon–Sun).
 * Days outside the requested year have `inYear = false`.
 */
export function buildHeatmapGrid(year: number): { date: string; inYear: boolean }[][] {
  // Start from the Monday on or before Jan 1
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const jan1Dow = jan1.getUTCDay(); // 0=Sun
  const daysFromMon = jan1Dow === 0 ? 6 : jan1Dow - 1;
  const startDate = addDays(jan1, -daysFromMon);

  // End at the Sunday on or after Dec 31
  const dec31 = new Date(Date.UTC(year, 11, 31));
  const dec31Dow = dec31.getUTCDay();
  const daysToSun = dec31Dow === 0 ? 0 : 7 - dec31Dow;
  const endDate = addDays(dec31, daysToSun);

  const weeks: { date: string; inYear: boolean }[][] = [];
  let d = new Date(startDate);

  while (d.getTime() <= endDate.getTime()) {
    const week: { date: string; inYear: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      week.push({
        date: formatLocalDate(d),
        inYear: d.getUTCFullYear() === year,
      });
      d = addDays(d, 1);
    }
    weeks.push(week);
  }

  return weeks;
}
