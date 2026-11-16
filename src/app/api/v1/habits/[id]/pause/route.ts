import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import * as habitService from "@/server/services/habitService";
import { HabitServiceError } from "@/server/services/habitService";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const habit = await habitService.pauseHabit(id, session.user.id);

    return NextResponse.json({ success: true, data: habit, message: "Habit paused successfully" });
  } catch (error) {
    if (error instanceof HabitServiceError) {
      const status = error.code === "NOT_FOUND" ? 404 : error.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status }
      );
    }
    console.error("POST /api/v1/habits/[id]/pause error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}
