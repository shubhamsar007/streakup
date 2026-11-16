import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getHabitStreak } from "@/server/services/streakService";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { timezone: true },
    });

    const streak = await getHabitStreak(id, session.user.id, user?.timezone ?? "UTC");
    if (!streak) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Habit not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: streak });
  } catch (error) {
    console.error("GET /streaks/habits/:id error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}
