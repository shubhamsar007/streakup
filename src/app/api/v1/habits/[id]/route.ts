import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { updateHabitSchema } from "@/server/validators/habitValidators";
import * as habitRepo from "@/server/repositories/habitRepository";
import * as habitService from "@/server/services/habitService";
import { HabitServiceError } from "@/server/services/habitService";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const habit = await habitRepo.findById(id);

    if (!habit) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Habit not found" } },
        { status: 404 }
      );
    }

    if (habit.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...habit,
        targetValue: habit.targetValue ? Number(habit.targetValue) : null,
        currentStreak: 0,
      },
      message: "Habit retrieved",
    });
  } catch (error) {
    console.error("GET /api/v1/habits/[id] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateHabitSchema.parse(body);

    const habit = await habitService.updateHabit(id, session.user.id, data);

    return NextResponse.json({ success: true, data: habit, message: "Habit updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues ?? [];
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: issues[0]?.message ?? "Invalid input" } },
        { status: 400 }
      );
    }
    if (error instanceof HabitServiceError) {
      const status = error.code === "NOT_FOUND" ? 404 : error.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status }
      );
    }
    console.error("PATCH /api/v1/habits/[id] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { id } = await params;
    await habitService.archiveHabit(id, session.user.id);

    return NextResponse.json({ success: true, data: null, message: "Habit archived successfully" });
  } catch (error) {
    if (error instanceof HabitServiceError) {
      const status = error.code === "NOT_FOUND" ? 404 : error.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status }
      );
    }
    console.error("DELETE /api/v1/habits/[id] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}
