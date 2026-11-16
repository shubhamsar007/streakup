import * as habitRepo from "@/server/repositories/habitRepository";
import { prisma } from "@/lib/prisma";
import type { CreateHabitInput, UpdateHabitInput } from "@/server/validators/habitValidators";
import { checkAndAwardMilestone, getHabitStreak } from "./streakService";

// ─── Types ────────────────────────────────────────────────────────────────────

export class HabitServiceError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "HabitServiceError";
  }
}

type HabitWithSchedule = NonNullable<Awaited<ReturnType<typeof habitRepo.findById>>>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse a YYYY-MM-DD string to a UTC midnight Date object for use as a Prisma @db.Date field.
 */
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!));
}

/**
 * Returns today's date as a Date object (UTC midnight) based on a timezone string.
 * Falls back to UTC if the timezone is invalid.
 */
function getTodayInTimezone(timezone: string): Date {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(new Date());
    const year = parts.find((p) => p.type === "year")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  } catch {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
}

/**
 * Subtract one day from a Date object (UTC).
 */
function subtractOneDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - 1);
  return d;
}

/**
 * Returns the ISO weekday number for a given Date object (1=Mon, 7=Sun).
 */
function getISOWeekday(date: Date): number {
  const day = date.getUTCDay(); // 0=Sun, 1=Mon, ...
  return day === 0 ? 7 : day;
}

/**
 * Determines whether a habit is scheduled on a given date by inspecting its
 * schedule versions.
 */
export function isHabitScheduledOnDate(
  habit: HabitWithSchedule,
  date: Date
): boolean {
  const versions = habit.scheduleVersions;

  const activeVersion = versions.find((v) => {
    const from = new Date(v.validFrom).getTime();
    const dateTime = date.getTime();
    if (dateTime < from) return false;
    if (v.validUntil !== null && dateTime > new Date(v.validUntil).getTime()) return false;
    return true;
  });

  if (!activeVersion) return false;

  if (activeVersion.frequencyType === "DAILY") return true;

  const weekday = getISOWeekday(date);
  return activeVersion.scheduleDays.some((sd) => sd.weekday === weekday);
}

// ─── Service Functions ────────────────────────────────────────────────────────

export async function createHabit(userId: string, data: CreateHabitInput) {
  const startDate = parseDateString(data.startDate);

  return habitRepo.create(
    {
      userId,
      name: data.name,
      description: data.description,
      category: data.category,
      icon: data.icon,
      trackingType: data.trackingType,
      targetValue: data.targetValue,
      unit: data.unit,
      visibility: data.visibility,
      startDate,
    },
    {
      frequencyType: data.frequencyType,
      validFrom: startDate,
      selectedDays: data.selectedDays,
    }
  );
}

export async function updateHabit(
  habitId: string,
  userId: string,
  data: UpdateHabitInput
) {
  const habit = await habitRepo.findById(habitId);
  if (!habit) {
    throw new HabitServiceError("NOT_FOUND", "Habit not found");
  }
  if (habit.userId !== userId) {
    throw new HabitServiceError("FORBIDDEN", "You do not own this habit");
  }

  const scheduleChanged =
    data.frequencyType !== undefined || data.selectedDays !== undefined;

  if (scheduleChanged) {
    const today = getTodayInTimezone("UTC");
    const yesterday = subtractOneDay(today);

    // Close current active schedule version
    const activeVersion = habit.scheduleVersions.find((v) => v.validUntil === null);
    if (activeVersion) {
      await habitRepo.closeScheduleVersion(activeVersion.id, yesterday);
    }

    // Create new schedule version starting today
    const newFrequencyType = data.frequencyType ?? habit.scheduleVersions[0]?.frequencyType ?? "DAILY";
    await habitRepo.createScheduleVersion(habitId, {
      frequencyType: newFrequencyType,
      validFrom: today,
      selectedDays: data.selectedDays,
    });
  }

  // Update basic habit fields
  const updatedHabit = await habitRepo.update(habitId, {
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.description !== undefined ? { description: data.description ?? null } : {}),
    ...(data.category !== undefined ? { category: data.category } : {}),
    ...(data.icon !== undefined ? { icon: data.icon ?? null } : {}),
    ...(data.trackingType !== undefined ? { trackingType: data.trackingType } : {}),
    ...(data.targetValue !== undefined ? { targetValue: data.targetValue ?? null } : {}),
    ...(data.unit !== undefined ? { unit: data.unit ?? null } : {}),
    ...(data.visibility !== undefined ? { visibility: data.visibility } : {}),
  });

  return updatedHabit;
}

export async function pauseHabit(habitId: string, userId: string) {
  const habit = await habitRepo.findById(habitId);
  if (!habit) throw new HabitServiceError("NOT_FOUND", "Habit not found");
  if (habit.userId !== userId) throw new HabitServiceError("FORBIDDEN", "You do not own this habit");
  if (habit.status !== "ACTIVE") throw new HabitServiceError("INVALID_STATUS", "Habit is not active");

  // Close the active schedule version so the streak engine knows this period is paused.
  // The gap between validUntil and the next version's validFrom = paused period.
  const today = getTodayInTimezone("UTC");
  const yesterday = subtractOneDay(today);
  const activeVersion = habit.scheduleVersions.find((v) => v.validUntil === null);
  if (activeVersion) {
    await habitRepo.closeScheduleVersion(activeVersion.id, yesterday);
  }

  return habitRepo.update(habitId, { status: "PAUSED" });
}

export async function resumeHabit(habitId: string, userId: string) {
  const habit = await habitRepo.findById(habitId);
  if (!habit) throw new HabitServiceError("NOT_FOUND", "Habit not found");
  if (habit.userId !== userId) throw new HabitServiceError("FORBIDDEN", "You do not own this habit");
  if (habit.status !== "PAUSED") throw new HabitServiceError("INVALID_STATUS", "Habit is not paused");

  const today = getTodayInTimezone("UTC");
  const yesterday = subtractOneDay(today);

  // Close current active schedule version
  const activeVersion = habit.scheduleVersions.find((v) => v.validUntil === null);
  if (activeVersion) {
    await habitRepo.closeScheduleVersion(activeVersion.id, yesterday);

    // Create a new schedule version from today using the same frequency
    await habitRepo.createScheduleVersion(habitId, {
      frequencyType: activeVersion.frequencyType,
      validFrom: today,
      selectedDays: activeVersion.scheduleDays.map((d) => d.weekday),
    });
  }

  return habitRepo.update(habitId, { status: "ACTIVE" });
}

export async function archiveHabit(habitId: string, userId: string) {
  const habit = await habitRepo.findById(habitId);
  if (!habit) throw new HabitServiceError("NOT_FOUND", "Habit not found");
  if (habit.userId !== userId) throw new HabitServiceError("FORBIDDEN", "You do not own this habit");
  if (habit.status === "ARCHIVED") throw new HabitServiceError("INVALID_STATUS", "Habit is already archived");

  return habitRepo.update(habitId, { status: "ARCHIVED" });
}

export async function completeHabit(
  habitId: string,
  userId: string,
  localDateStr: string,
  completedValue?: number
) {
  const habit = await habitRepo.findById(habitId);
  if (!habit) throw new HabitServiceError("NOT_FOUND", "Habit not found");
  if (habit.userId !== userId) throw new HabitServiceError("FORBIDDEN", "You do not own this habit");
  if (habit.status !== "ACTIVE") throw new HabitServiceError("INVALID_STATUS", "Habit is not active");

  const localDate = parseDateString(localDateStr);
  const startDate = new Date(habit.startDate);

  if (localDate.getTime() < startDate.getTime()) {
    throw new HabitServiceError("INVALID_DATE", "Cannot complete a habit before its start date");
  }

  if (!isHabitScheduledOnDate(habit, localDate)) {
    throw new HabitServiceError("NOT_SCHEDULED", "Habit is not scheduled on this date");
  }

  const existing = await habitRepo.findCompletionByDate(habitId, localDate);

  if (existing) {
    // Update existing completion
    return habitRepo.updateCompletion(existing.id, completedValue);
  } else {
    // Create new completion
    const completion = await habitRepo.createCompletion({
      habitId,
      localDate,
      completedValue,
      completedAt: new Date(),
    });

    // Create activity record (store metadata for feed display)
    await prisma.activity.create({
      data: {
        userId,
        habitId,
        completionId: completion.id,
        type: "HABIT_COMPLETED",
        visibility: habit.visibility,
        metadata: {
          habitName: habit.name,
          completedValue: completedValue ?? null,
          unit: habit.unit ?? null,
        },
      },
    });

    // Check for streak milestones (fire-and-forget — don't fail completion if this errors)
    const userTimezone = (await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    }))?.timezone ?? "UTC";

    getHabitStreak(habitId, userId, userTimezone)
      .then((streakData) => {
        if (streakData) {
          return checkAndAwardMilestone(habitId, userId, streakData.current);
        }
      })
      .catch((err) => console.error("Milestone check error:", err));

    return completion;
  }
}

export async function undoCompletion(
  habitId: string,
  userId: string,
  localDateStr: string
) {
  const habit = await habitRepo.findById(habitId);
  if (!habit) throw new HabitServiceError("NOT_FOUND", "Habit not found");
  if (habit.userId !== userId) throw new HabitServiceError("FORBIDDEN", "You do not own this habit");

  const localDate = parseDateString(localDateStr);
  const existing = await habitRepo.findCompletionByDate(habitId, localDate);
  if (!existing) throw new HabitServiceError("NOT_FOUND", "No completion found for this date");

  return habitRepo.deleteCompletion(existing.id);
}

export async function getHabitsForDate(userId: string, localDateStr: string) {
  const localDate = parseDateString(localDateStr);

  // Fetch all active habits with all schedule versions
  const habits = await prisma.habit.findMany({
    where: { userId, status: "ACTIVE" },
    include: {
      scheduleVersions: {
        include: { scheduleDays: true },
        orderBy: { validFrom: "desc" },
      },
      completions: {
        where: { localDate },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const startOfHabitDate = localDate.getTime();

  return habits
    .filter((habit) => {
      // Habit must have started on or before this date
      const startDate = new Date(habit.startDate);
      if (startOfHabitDate < startDate.getTime()) return false;
      return isHabitScheduledOnDate(habit as HabitWithSchedule, localDate);
    })
    .map((habit) => ({
      ...habit,
      completion: habit.completions[0] ?? null,
      isCompleted: habit.completions.length > 0,
    }));
}

export async function getHabitsList(userId: string, status?: string) {
  const statusFilter =
    status === "ACTIVE" || status === "PAUSED" || status === "ARCHIVED"
      ? status
      : undefined;

  return habitRepo.findByUserId(userId, statusFilter);
}
