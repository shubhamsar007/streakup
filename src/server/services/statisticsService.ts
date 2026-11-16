import { prisma } from "@/lib/prisma";
import { formatLocalDate, addDays, getTodayUTC } from "@/lib/dateUtils";
import { isScheduledOn, calculateHabitStreak, type HabitForStreak } from "./streakEngine";
import { getOverallStreak } from "./streakService";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OverviewStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  weeklyRate: number;    // 0-100
  monthlyRate: number;   // 0-100
  mostConsistentHabit: { id: string; name: string; completionRate: number } | null;
  activeHabits: number;
}

export interface WeekStat {
  weekStart: string;
  weekEnd: string;
  label: string;         // e.g. "Nov 4"
  scheduled: number;
  completed: number;
  rate: number;          // 0-100
}

export interface MonthStat {
  month: string;         // e.g. "2024-11"
  label: string;         // e.g. "Nov 2024"
  scheduled: number;
  completed: number;
  rate: number;          // 0-100
}

export interface HabitStat {
  id: string;
  name: string;
  category: string;
  status: string;
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  completionRate: number;
  eligibleDays: number;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

type HabitForStats = HabitForStreak & { name?: string; category?: string };

function buildCompletionMap(habits: Array<{ id: string; completions: Array<{ localDate: Date | string }> }>) {
  const map = new Map<string, Set<string>>(); // dateStr → Set<habitId>
  for (const h of habits) {
    for (const c of h.completions) {
      const key = formatLocalDate(new Date(c.localDate));
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(h.id);
    }
  }
  return map;
}

/**
 * Count scheduled habit-days vs completed habit-days in a given date range.
 * Only counts days up to `today` to avoid counting future days as missed.
 */
function countInRange(
  habits: HabitForStats[],
  completionMap: Map<string, Set<string>>,
  fromDate: Date,
  toDate: Date
): { scheduled: number; completed: number } {
  let scheduled = 0;
  let completed = 0;

  let d = new Date(fromDate);
  while (d.getTime() <= toDate.getTime()) {
    const key = formatLocalDate(d);
    for (const habit of habits) {
      if (habit.startDate.getTime() > d.getTime()) continue;
      if (isScheduledOn(habit.scheduleVersions, d)) {
        scheduled++;
        if (completionMap.get(key)?.has(habit.id)) {
          completed++;
        }
      }
    }
    d = addDays(d, 1);
  }

  return { scheduled, completed };
}

function mapHabitsForEngine(
  habits: Array<{
    id: string;
    startDate: Date | string;
    scheduleVersions: Array<{
      frequencyType: "DAILY" | "SELECTED_DAYS";
      validFrom: Date | string;
      validUntil: Date | string | null;
      scheduleDays: { weekday: number }[];
    }>;
  }>
): HabitForStats[] {
  return habits.map((h) => ({
    id: h.id,
    startDate: new Date(h.startDate),
    scheduleVersions: h.scheduleVersions.map((v) => ({
      frequencyType: v.frequencyType,
      validFrom: new Date(v.validFrom),
      validUntil: v.validUntil ? new Date(v.validUntil) : null,
      scheduleDays: v.scheduleDays,
    })),
  }));
}

// ─── Service Functions ────────────────────────────────────────────────────────

export async function getOverviewStats(
  userId: string,
  timezone: string
): Promise<OverviewStats> {
  const today = getTodayUTC(timezone);

  const [habits, overallStreak] = await Promise.all([
    prisma.habit.findMany({
      where: { userId, status: { not: "ARCHIVED" } },
      include: {
        scheduleVersions: {
          include: { scheduleDays: true },
          orderBy: { validFrom: "asc" },
        },
        completions: {
          select: { habitId: true, localDate: true },
        },
      },
    }),
    getOverallStreak(userId, timezone),
  ]);

  const totalCompletions = habits.reduce((sum, h) => sum + h.completions.length, 0);
  const activeHabits = habits.filter((h) => h.status === "ACTIVE").length;
  const completionMap = buildCompletionMap(habits);
  const habitsForEngine = mapHabitsForEngine(habits);

  // Weekly rate — current Mon to today
  const dow = today.getUTCDay();
  const daysFromMon = dow === 0 ? 6 : dow - 1;
  const weekStart = addDays(today, -daysFromMon);
  const weekly = countInRange(habitsForEngine, completionMap, weekStart, today);
  const weeklyRate = weekly.scheduled > 0
    ? Math.round((weekly.completed / weekly.scheduled) * 100)
    : 0;

  // Monthly rate — 1st of current month to today
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const monthly = countInRange(habitsForEngine, completionMap, monthStart, today);
  const monthlyRate = monthly.scheduled > 0
    ? Math.round((monthly.completed / monthly.scheduled) * 100)
    : 0;

  // Most consistent habit (by completion rate, requires ≥1 eligible day)
  let mostConsistentHabit: { id: string; name: string; completionRate: number } | null = null;
  let bestRate = -1;

  for (const habit of habits.filter((h) => h.status === "ACTIVE")) {
    const hfe: HabitForStreak = {
      id: habit.id,
      startDate: new Date(habit.startDate),
      scheduleVersions: habit.scheduleVersions.map((v) => ({
        frequencyType: v.frequencyType,
        validFrom: new Date(v.validFrom),
        validUntil: v.validUntil ? new Date(v.validUntil) : null,
        scheduleDays: v.scheduleDays,
      })),
    };
    const completionDates = habit.completions.map((c) => new Date(c.localDate));
    const streak = calculateHabitStreak(hfe, completionDates, today);

    if (streak.eligibleDays > 0 && streak.completionRate > bestRate) {
      bestRate = streak.completionRate;
      mostConsistentHabit = {
        id: habit.id,
        name: habit.name,
        completionRate: streak.completionRate,
      };
    }
  }

  return {
    currentStreak: overallStreak.current,
    longestStreak: overallStreak.longest,
    totalCompletions,
    weeklyRate,
    monthlyRate,
    mostConsistentHabit,
    activeHabits,
  };
}

export async function getWeeklyStats(
  userId: string,
  timezone: string,
  weekCount = 8
): Promise<WeekStat[]> {
  const today = getTodayUTC(timezone);
  const dow = today.getUTCDay();
  const daysFromMon = dow === 0 ? 6 : dow - 1;
  const currentWeekStart = addDays(today, -daysFromMon);
  const rangeStart = addDays(currentWeekStart, -(weekCount - 1) * 7);

  const habits = await prisma.habit.findMany({
    where: { userId, status: { not: "ARCHIVED" } },
    include: {
      scheduleVersions: {
        include: { scheduleDays: true },
        orderBy: { validFrom: "asc" },
      },
      completions: {
        where: { localDate: { gte: rangeStart, lte: today } },
        select: { habitId: true, localDate: true },
      },
    },
  });

  const completionMap = buildCompletionMap(habits);
  const habitsForEngine = mapHabitsForEngine(habits);
  const weeks: WeekStat[] = [];

  for (let i = weekCount - 1; i >= 0; i--) {
    const weekStart = addDays(currentWeekStart, -i * 7);
    const weekEnd = addDays(weekStart, 6);
    const effectiveEnd = weekEnd.getTime() > today.getTime() ? today : weekEnd;

    const { scheduled, completed } = countInRange(
      habitsForEngine,
      completionMap,
      weekStart,
      effectiveEnd
    );
    const rate = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;

    weeks.push({
      weekStart: formatLocalDate(weekStart),
      weekEnd: formatLocalDate(weekEnd),
      label: new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(weekStart),
      scheduled,
      completed,
      rate,
    });
  }

  return weeks;
}

export async function getMonthlyStats(
  userId: string,
  timezone: string,
  monthCount = 6
): Promise<MonthStat[]> {
  const today = getTodayUTC(timezone);

  // Build month date ranges
  type MonthRange = { monthStart: Date; monthEnd: Date; label: string; key: string };
  const monthRanges: MonthRange[] = [];

  for (let i = monthCount - 1; i >= 0; i--) {
    const year = today.getUTCFullYear();
    const month = today.getUTCMonth() - i;
    const monthStart = new Date(Date.UTC(year, month, 1));
    const monthEnd = new Date(Date.UTC(year, month + 1, 0)); // last day of month

    monthRanges.push({
      monthStart,
      monthEnd,
      label: new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(monthStart),
      key: formatLocalDate(monthStart).slice(0, 7),
    });
  }

  const rangeStart = monthRanges[0]!.monthStart;

  const habits = await prisma.habit.findMany({
    where: { userId, status: { not: "ARCHIVED" } },
    include: {
      scheduleVersions: {
        include: { scheduleDays: true },
        orderBy: { validFrom: "asc" },
      },
      completions: {
        where: { localDate: { gte: rangeStart, lte: today } },
        select: { habitId: true, localDate: true },
      },
    },
  });

  const completionMap = buildCompletionMap(habits);
  const habitsForEngine = mapHabitsForEngine(habits);

  return monthRanges.map(({ monthStart, monthEnd, label, key }) => {
    const effectiveEnd = monthEnd.getTime() > today.getTime() ? today : monthEnd;
    const { scheduled, completed } = countInRange(
      habitsForEngine,
      completionMap,
      monthStart,
      effectiveEnd
    );
    const rate = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;

    return { month: key, label, scheduled, completed, rate };
  });
}

export async function getHabitStats(
  userId: string,
  timezone: string
): Promise<HabitStat[]> {
  const today = getTodayUTC(timezone);

  const habits = await prisma.habit.findMany({
    where: { userId, status: { not: "ARCHIVED" } },
    include: {
      scheduleVersions: {
        include: { scheduleDays: true },
        orderBy: { validFrom: "asc" },
      },
      completions: {
        select: { localDate: true },
        orderBy: { localDate: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return habits.map((habit) => {
    const hfe: HabitForStreak = {
      id: habit.id,
      startDate: new Date(habit.startDate),
      scheduleVersions: habit.scheduleVersions.map((v) => ({
        frequencyType: v.frequencyType,
        validFrom: new Date(v.validFrom),
        validUntil: v.validUntil ? new Date(v.validUntil) : null,
        scheduleDays: v.scheduleDays,
      })),
    };
    const completionDates = habit.completions.map((c) => new Date(c.localDate));
    const streak = calculateHabitStreak(hfe, completionDates, today);

    return {
      id: habit.id,
      name: habit.name,
      category: habit.category,
      status: habit.status,
      currentStreak: streak.current,
      longestStreak: streak.longest,
      totalCompleted: streak.totalCompleted,
      completionRate: streak.completionRate,
      eligibleDays: streak.eligibleDays,
    };
  });
}
