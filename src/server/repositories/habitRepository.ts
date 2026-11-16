import { prisma } from "@/lib/prisma";
import { HabitStatus, FrequencyType, HabitTrackingType, HabitVisibility } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateHabitData {
  userId: string;
  name: string;
  description?: string;
  category: string;
  icon?: string;
  trackingType: HabitTrackingType;
  targetValue?: number;
  unit?: string;
  visibility: HabitVisibility;
  startDate: Date;
}

export interface CreateScheduleVersionData {
  frequencyType: FrequencyType;
  validFrom: Date;
  selectedDays?: number[];
}

export interface CreateCompletionData {
  habitId: string;
  localDate: Date;
  completedValue?: number;
  completedAt: Date;
}

// ─── Repository Functions ─────────────────────────────────────────────────────

export async function findByUserId(userId: string, status?: HabitStatus) {
  return prisma.habit.findMany({
    where: {
      userId,
      ...(status ? { status } : {}),
    },
    include: {
      scheduleVersions: {
        where: { validUntil: null },
        include: { scheduleDays: true },
        orderBy: { validFrom: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function findById(id: string) {
  return prisma.habit.findUnique({
    where: { id },
    include: {
      scheduleVersions: {
        include: { scheduleDays: true },
        orderBy: { validFrom: "desc" },
      },
      completions: {
        orderBy: { localDate: "desc" },
        take: 90,
      },
    },
  });
}

export async function create(
  data: CreateHabitData,
  scheduleData: CreateScheduleVersionData
) {
  return prisma.$transaction(async (tx) => {
    const habit = await tx.habit.create({
      data: {
        userId: data.userId,
        name: data.name,
        description: data.description,
        category: data.category,
        icon: data.icon,
        trackingType: data.trackingType,
        targetValue: data.targetValue,
        unit: data.unit,
        visibility: data.visibility,
        startDate: data.startDate,
      },
    });

    const scheduleVersion = await tx.habitScheduleVersion.create({
      data: {
        habitId: habit.id,
        frequencyType: scheduleData.frequencyType,
        validFrom: scheduleData.validFrom,
        validUntil: null,
      },
    });

    if (
      scheduleData.frequencyType === "SELECTED_DAYS" &&
      scheduleData.selectedDays?.length
    ) {
      await tx.habitScheduleDay.createMany({
        data: scheduleData.selectedDays.map((weekday) => ({
          scheduleVersionId: scheduleVersion.id,
          weekday,
        })),
      });
    }

    return habit;
  });
}

export async function update(
  id: string,
  data: Partial<{
    name: string;
    description: string | null;
    category: string;
    icon: string | null;
    trackingType: HabitTrackingType;
    targetValue: number | null;
    unit: string | null;
    visibility: HabitVisibility;
    status: HabitStatus;
  }>
) {
  return prisma.habit.update({
    where: { id },
    data,
  });
}

export async function createScheduleVersion(
  habitId: string,
  data: CreateScheduleVersionData
) {
  return prisma.$transaction(async (tx) => {
    const scheduleVersion = await tx.habitScheduleVersion.create({
      data: {
        habitId,
        frequencyType: data.frequencyType,
        validFrom: data.validFrom,
        validUntil: null,
      },
    });

    if (data.frequencyType === "SELECTED_DAYS" && data.selectedDays?.length) {
      await tx.habitScheduleDay.createMany({
        data: data.selectedDays.map((weekday) => ({
          scheduleVersionId: scheduleVersion.id,
          weekday,
        })),
      });
    }

    return scheduleVersion;
  });
}

export async function closeScheduleVersion(id: string, validUntil: Date) {
  return prisma.habitScheduleVersion.update({
    where: { id },
    data: { validUntil },
  });
}

export async function findCompletionByDate(habitId: string, localDate: Date) {
  return prisma.habitCompletion.findUnique({
    where: { habitId_localDate: { habitId, localDate } },
  });
}

export async function createCompletion(data: CreateCompletionData) {
  return prisma.habitCompletion.create({
    data: {
      habitId: data.habitId,
      localDate: data.localDate,
      completedValue: data.completedValue,
      completedAt: data.completedAt,
    },
  });
}

export async function updateCompletion(id: string, completedValue: number | undefined) {
  return prisma.habitCompletion.update({
    where: { id },
    data: {
      completedValue: completedValue ?? null,
      completedAt: new Date(),
    },
  });
}

export async function deleteCompletion(id: string) {
  return prisma.habitCompletion.delete({ where: { id } });
}

export async function findCompletionsByDateRange(
  habitId: string,
  from: Date,
  to: Date
) {
  return prisma.habitCompletion.findMany({
    where: {
      habitId,
      localDate: { gte: from, lte: to },
    },
    orderBy: { localDate: "asc" },
  });
}
