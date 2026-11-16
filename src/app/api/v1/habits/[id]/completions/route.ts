import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import * as habitService from "@/server/services/habitService";
import { HabitServiceError } from "@/server/services/habitService";

type RouteParams = { params: Promise<{ id: string }> };

const completeHabitSchema = z.object({
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  completedValue: z.number().positive().optional(),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const data = completeHabitSchema.parse(body);

    const completion = await habitService.completeHabit(
      id,
      session.user.id,
      data.localDate,
      data.completedValue
    );

    return NextResponse.json(
      { success: true, data: completion, message: "Habit completed successfully" },
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
      const status = error.code === "NOT_FOUND" ? 404 : error.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status }
      );
    }
    console.error("POST /api/v1/habits/[id]/completions error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}
