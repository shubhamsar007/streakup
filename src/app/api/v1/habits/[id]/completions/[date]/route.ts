import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import * as habitService from "@/server/services/habitService";
import { HabitServiceError } from "@/server/services/habitService";

type RouteParams = { params: Promise<{ id: string; date: string }> };

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { id, date } = await params;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Date must be YYYY-MM-DD" } },
        { status: 400 }
      );
    }

    await habitService.undoCompletion(id, session.user.id, date);

    return NextResponse.json({ success: true, data: null, message: "Completion removed successfully" });
  } catch (error) {
    if (error instanceof HabitServiceError) {
      const status = error.code === "NOT_FOUND" ? 404 : error.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status }
      );
    }
    console.error("DELETE /api/v1/habits/[id]/completions/[date] error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}
