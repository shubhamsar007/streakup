import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createHabitSchema } from "@/server/validators/habitValidators";
import * as habitService from "@/server/services/habitService";
import { HabitServiceError } from "@/server/services/habitService";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;

    const habits = await habitService.getHabitsList(session.user.id, status);

    const data = habits.map((habit) => ({
      id: habit.id,
      name: habit.name,
      description: habit.description,
      category: habit.category,
      icon: habit.icon,
      trackingType: habit.trackingType,
      targetValue: habit.targetValue ? Number(habit.targetValue) : null,
      unit: habit.unit,
      visibility: habit.visibility,
      status: habit.status,
      startDate: habit.startDate,
      createdAt: habit.createdAt,
      updatedAt: habit.updatedAt,
      currentStreak: 0,
      scheduleVersions: habit.scheduleVersions,
    }));

    return NextResponse.json({ success: true, data, message: "Habits retrieved" });
  } catch (error) {
    console.error("GET /api/v1/habits error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = createHabitSchema.parse(body);

    const habit = await habitService.createHabit(session.user.id, data);

    return NextResponse.json(
      { success: true, data: habit, message: "Habit created successfully" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues ?? [];
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: issues[0]?.message ?? "Invalid input" } },
        { status: 400 }
      );
    }
    if (error instanceof HabitServiceError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: 400 }
      );
    }
    console.error("POST /api/v1/habits error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}
