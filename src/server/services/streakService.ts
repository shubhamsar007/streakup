import { prisma } from "@/lib/prisma";
import { getTodayUTC, parseLocalDate } from "@/lib/dateUtils";
import {
  calculateHabitStreak,
  calculateOverallStreak,
  isMilestone,
  type HabitForStreak,
  type CompletionDate,
} from "./streakEngine";

// ─── Individual habit streak ───────────────────────────────────────────────

export async function getHabitStreak(habitId: string, userId: string, timezone = "UTC") {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
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
  });

  if (!habit) return null;

  const today = getTodayUTC(timezone);
  const habitForEngine: HabitForStreak = {
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
  return calculateHabitStreak(habitForEngine, completionDates, today);
}

// ─── Overall user streak ───────────────────────────────────────────────────

export async function getOverallStreak(userId: string, timezone = "UTC") {
  // Fetch all habits (all statuses) with their schedule versions and completions
  const habits = await prisma.habit.findMany({
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
  });

  if (habits.length === 0) return { current: 0, longest: 0 };

  const today = getTodayUTC(timezone);

  const habitsForEngine: HabitForStreak[] = habits.map((h) => ({
    id: h.id,
    startDate: new Date(h.startDate),
    scheduleVersions: h.scheduleVersions.map((v) => ({
      frequencyType: v.frequencyType,
      validFrom: new Date(v.validFrom),
      validUntil: v.validUntil ? new Date(v.validUntil) : null,
      scheduleDays: v.scheduleDays,
    })),
  }));

  const completions: CompletionDate[] = habits.flatMap((h) =>
    h.completions.map((c) => ({
      habitId: c.habitId,
      localDate: new Date(c.localDate),
    }))
  );

  return calculateOverallStreak(habitsForEngine, completions, today);
}

// ─── Streak data for all habits (dashboard / habit list) ──────────────────

export async function getAllHabitStreaks(userId: string, timezone = "UTC") {
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
  });

  const today = getTodayUTC(timezone);

  return habits.map((habit) => {
    const habitForEngine: HabitForStreak = {
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
    const streak = calculateHabitStreak(habitForEngine, completionDates, today);
    return { habitId: habit.id, ...streak };
  });
}

// ─── Milestone detection + notification ───────────────────────────────────

export async function checkAndAwardMilestone(
  habitId: string,
  userId: string,
  currentStreak: number
) {
  if (!isMilestone(currentStreak)) return;

  // Check if this milestone notification was already created to prevent duplicates
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      type: "STREAK_MILESTONE",
      entityId: habitId,
    },
    orderBy: { createdAt: "desc" },
  });

  // Encode milestone value in metadata stored in a UserAchievement
  const achievementKey = `streak_${currentStreak}`;
  const alreadyAwarded = await prisma.userAchievement.findFirst({
    where: {
      userId,
      habitId,
      achievement: { key: achievementKey },
    },
  });

  if (alreadyAwarded) return; // Already awarded this milestone for this habit

  // Find or create the achievement definition
  const achievement = await prisma.achievement.upsert({
    where: { key: achievementKey },
    create: {
      key: achievementKey,
      name: `${currentStreak}-Day Streak`,
      description: `Completed a habit for ${currentStreak} consecutive days`,
      milestoneValue: currentStreak,
    },
    update: {},
  });

  // Award to user
  await prisma.userAchievement.create({
    data: { userId, achievementId: achievement.id, habitId },
  });

  // Create in-app notification
  await prisma.notification.create({
    data: {
      userId,
      type: "STREAK_MILESTONE",
      entityId: habitId,
    },
  });
}
