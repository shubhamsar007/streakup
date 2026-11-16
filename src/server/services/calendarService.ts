import { prisma } from "@/lib/prisma";
import { formatLocalDate, parseLocalDate, getTodayUTC } from "@/lib/dateUtils";
import { isScheduledOn } from "./streakEngine";

// Re-export pure utilities for use in server components that import this module.
// Client components should import directly from "@/lib/calendarUtils".
export type { CalendarData } from "@/lib/calendarUtils";
export { buildHeatmapGrid } from "@/lib/calendarUtils";

export interface DateDetail {
  date: string;
  scheduledHabits: {
    id: string;
    name: string;
    category: string;
    isCompleted: boolean;
  }[];
  tasks: {
    id: string;
    title: string;
    status: string;
  }[];
}

/**
 * Returns a map of dateStr → completion count for a given year.
 * If habitId is provided, only completions for that habit are counted.
 */
export async function getCalendarData(
  userId: string,
  year: number,
  _timezone: string,
  habitId?: string
): Promise<import("@/lib/calendarUtils").CalendarData> {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));

  const completions = await prisma.habitCompletion.findMany({
    where: {
      habit: { userId },
      localDate: { gte: start, lte: end },
      ...(habitId ? { habitId } : {}),
    },
    select: { habitId: true, localDate: true },
  });

  const result: import("@/lib/calendarUtils").CalendarData = {};
  for (const c of completions) {
    const key = formatLocalDate(new Date(c.localDate));
    result[key] = (result[key] ?? 0) + 1;
  }

  return result;
}

/**
 * Returns the list of habits (with completion/missed status) and tasks for a specific date.
 */
export async function getDateDetail(
  userId: string,
  dateStr: string,
  _timezone: string
): Promise<DateDetail> {
  const date = parseLocalDate(dateStr);

  const [habits, tasks] = await Promise.all([
    prisma.habit.findMany({
      where: { userId, status: { not: "ARCHIVED" } },
      include: {
        scheduleVersions: {
          include: { scheduleDays: true },
          orderBy: { validFrom: "asc" },
        },
        completions: {
          where: { localDate: date },
        },
      },
    }),
    prisma.dailyTask.findMany({
      where: { userId, taskDate: date },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const scheduledHabits = habits
    .filter((h) => {
      const startDate = new Date(h.startDate);
      if (startDate.getTime() > date.getTime()) return false;
      const versions = h.scheduleVersions.map((v) => ({
        frequencyType: v.frequencyType,
        validFrom: new Date(v.validFrom),
        validUntil: v.validUntil ? new Date(v.validUntil) : null,
        scheduleDays: v.scheduleDays,
      }));
      return isScheduledOn(versions, date);
    })
    .map((h) => ({
      id: h.id,
      name: h.name,
      category: h.category,
      isCompleted: h.completions.length > 0,
    }));

  return {
    date: dateStr,
    scheduledHabits,
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
    })),
  };
}

/**
 * Returns the user's habits (id + name) for use in the calendar filter.
 */
export async function getUserHabitsForFilter(userId: string) {
  return prisma.habit.findMany({
    where: { userId, status: { not: "ARCHIVED" } },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });
}

/** Returns the current year in the user's timezone. */
export function getCurrentYear(timezone: string): number {
  return getTodayUTC(timezone).getUTCFullYear();
}
