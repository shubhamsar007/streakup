/**
 * Pure streak calculation engine — no database calls.
 * All inputs are plain data; no Prisma types leak in here.
 * This makes the functions trivially unit-testable.
 */

import { addDays, isoWeekday, dateLte, dateGte, dateEq, formatLocalDate } from "@/lib/dateUtils";

// ─── Input types ──────────────────────────────────────────────────────────────

export interface ScheduleVersion {
  frequencyType: "DAILY" | "SELECTED_DAYS";
  validFrom: Date;   // UTC midnight (local calendar date)
  validUntil: Date | null;
  scheduleDays: { weekday: number }[]; // 1=Mon … 7=Sun
}

export interface HabitForStreak {
  id: string;
  startDate: Date;  // UTC midnight
  scheduleVersions: ScheduleVersion[];
}

export interface CompletionDate {
  habitId: string;
  localDate: Date; // UTC midnight
}

// ─── Streak result types ──────────────────────────────────────────────────────

export interface HabitStreakResult {
  current: number;
  longest: number;
  totalCompleted: number;
  completionRate: number; // 0-100
  eligibleDays: number;
}

export interface OverallStreakResult {
  current: number;
  longest: number;
}

// ─── Core helpers ─────────────────────────────────────────────────────────────

/**
 * Is a habit scheduled on a given date?
 * Returns false if the date falls in a gap (paused period) between schedule versions.
 */
export function isScheduledOn(versions: ScheduleVersion[], date: Date): boolean {
  const t = date.getTime();

  const version = versions.find((v) => {
    if (v.validFrom.getTime() > t) return false;
    if (v.validUntil !== null && v.validUntil.getTime() < t) return false;
    return true;
  });

  if (!version) return false; // gap = paused period

  if (version.frequencyType === "DAILY") return true;

  const dow = isoWeekday(date);
  return version.scheduleDays.some((d) => d.weekday === dow);
}

/**
 * Calculate current and longest streak for a single habit.
 *
 * Rules:
 * - Non-scheduled days are neutral (skip, don't break).
 * - Paused periods (gaps between schedule versions) are neutral.
 * - Today scheduled but not yet completed = still pending, don't break streak.
 * - Future dates are never counted as missed.
 */
export function calculateHabitStreak(
  habit: HabitForStreak,
  completions: Date[],   // array of UTC-midnight local dates that were completed
  today: Date
): HabitStreakResult {
  const completionSet = new Set(completions.map(formatLocalDate));
  const todayStr = formatLocalDate(today);
  const startDate = habit.startDate;

  // ── Current streak ────────────────────────────────────────────────────────
  // If today is scheduled but not completed, start checking from yesterday.
  let checkDate = new Date(today);
  if (
    isScheduledOn(habit.scheduleVersions, today) &&
    !completionSet.has(todayStr)
  ) {
    checkDate = addDays(today, -1);
  }

  let current = 0;
  while (dateGte(checkDate, startDate)) {
    if (!isScheduledOn(habit.scheduleVersions, checkDate)) {
      // Neutral day — keep going back
      checkDate = addDays(checkDate, -1);
      continue;
    }
    if (completionSet.has(formatLocalDate(checkDate))) {
      current++;
      checkDate = addDays(checkDate, -1);
    } else {
      break; // Missed scheduled day — streak ends
    }
  }

  // ── Longest streak + totals ───────────────────────────────────────────────
  let longest = 0;
  let runningStreak = 0;
  let totalCompleted = 0;
  let eligibleDays = 0;

  let scanDate = new Date(startDate);
  while (dateLte(scanDate, today)) {
    if (!isScheduledOn(habit.scheduleVersions, scanDate)) {
      scanDate = addDays(scanDate, 1);
      continue;
    }

    const scanStr = formatLocalDate(scanDate);
    const isFuture = scanDate.getTime() > today.getTime();
    const isPendingToday = scanStr === todayStr && !completionSet.has(scanStr);

    if (isFuture) {
      scanDate = addDays(scanDate, 1);
      continue;
    }

    eligibleDays++;

    if (completionSet.has(scanStr)) {
      totalCompleted++;
      runningStreak++;
      if (runningStreak > longest) longest = runningStreak;
    } else if (!isPendingToday) {
      // Missed scheduled day
      runningStreak = 0;
    }
    // isPendingToday → don't reset runningStreak (day not over yet)

    scanDate = addDays(scanDate, 1);
  }

  // Carry current run into longest if it's still going
  if (runningStreak > longest) longest = runningStreak;

  const completionRate =
    eligibleDays > 0 ? Math.round((totalCompleted / eligibleDays) * 100) : 0;

  return { current, longest, totalCompleted, completionRate, eligibleDays };
}

/**
 * Calculate the overall user streak.
 *
 * A day qualifies when the user completes at least one habit scheduled that day.
 * Neutral days (no habits scheduled) are skipped — they don't break the streak.
 *
 * @param habits     All of the user's habits (active + paused + archived)
 * @param completions  All completion records across all habits
 * @param today      UTC midnight for the user's local today
 */
export function calculateOverallStreak(
  habits: HabitForStreak[],
  completions: CompletionDate[],
  today: Date
): OverallStreakResult {
  if (habits.length === 0) return { current: 0, longest: 0 };

  // Build lookup: dateStr → Set of habitIds completed that day
  const completedByDate = new Map<string, Set<string>>();
  for (const c of completions) {
    const key = formatLocalDate(c.localDate);
    if (!completedByDate.has(key)) completedByDate.set(key, new Set());
    completedByDate.get(key)!.add(c.habitId);
  }

  // Earliest habit start date — our hard backstop
  const earliestStart = habits.reduce((min, h) =>
    h.startDate.getTime() < min.getTime() ? h.startDate : min,
    today
  );

  const todayStr = formatLocalDate(today);

  // ── Current streak ────────────────────────────────────────────────────────
  // Start from yesterday if today has scheduled habits but none completed
  const scheduledToday = habits.filter((h) =>
    dateLte(h.startDate, today) && isScheduledOn(h.scheduleVersions, today)
  );
  const completedToday = scheduledToday.some((h) =>
    completedByDate.get(todayStr)?.has(h.id)
  );

  let checkDate = today;
  if (scheduledToday.length > 0 && !completedToday) {
    checkDate = addDays(today, -1); // today is pending, start from yesterday
  }

  let current = 0;
  while (dateGte(checkDate, earliestStart)) {
    const dateStr = formatLocalDate(checkDate);
    const scheduledHere = habits.filter(
      (h) => dateLte(h.startDate, checkDate) && isScheduledOn(h.scheduleVersions, checkDate)
    );

    if (scheduledHere.length === 0) {
      // Neutral day
      checkDate = addDays(checkDate, -1);
      continue;
    }

    const hasCompletion = scheduledHere.some((h) =>
      completedByDate.get(dateStr)?.has(h.id)
    );

    if (hasCompletion) {
      current++;
      checkDate = addDays(checkDate, -1);
    } else {
      break;
    }
  }

  // ── Longest streak ────────────────────────────────────────────────────────
  let longest = 0;
  let run = 0;

  // Scan forward from earliest start to today
  let scanDate = new Date(earliestStart);
  while (dateLte(scanDate, today)) {
    const dateStr = formatLocalDate(scanDate);
    const scheduledHere = habits.filter(
      (h) => dateLte(h.startDate, scanDate) && isScheduledOn(h.scheduleVersions, scanDate)
    );

    if (scheduledHere.length === 0) {
      // Neutral — don't touch run
      scanDate = addDays(scanDate, 1);
      continue;
    }

    const isToday = dateEq(scanDate, today);
    const hasCompletion = scheduledHere.some((h) =>
      completedByDate.get(dateStr)?.has(h.id)
    );

    if (hasCompletion) {
      run++;
      if (run > longest) longest = run;
    } else if (!isToday) {
      run = 0;
    }

    scanDate = addDays(scanDate, 1);
  }
  if (run > longest) longest = run;

  return { current, longest };
}

// ─── Milestone helper ─────────────────────────────────────────────────────────

export const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100] as const;

export function isMilestone(streak: number): boolean {
  return (STREAK_MILESTONES as readonly number[]).includes(streak);
}
