import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import * as habitService from "@/server/services/habitService";

function getTodayString(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().split("T")[0]!;
  }
}

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const timezone = (session.user as { timezone?: string }).timezone ?? "UTC";
    const todayStr = getTodayString(timezone);

    const habits = await habitService.getHabitsForDate(session.user.id, todayStr);

    const completedCount = habits.filter((h) => h.isCompleted).length;

    return NextResponse.json({
      success: true,
      data: {
        date: todayStr,
        habits: habits.map((h) => ({
          id: h.id,
          name: h.name,
          category: h.category,
          icon: h.icon,
          trackingType: h.trackingType,
          targetValue: h.targetValue ? Number(h.targetValue) : null,
          unit: h.unit,
          isCompleted: h.isCompleted,
          completion: h.completion
            ? {
                id: h.completion.id,
                completedValue: h.completion.completedValue
                  ? Number(h.completion.completedValue)
                  : null,
                completedAt: h.completion.completedAt,
              }
            : null,
        })),
        progress: { completed: completedCount, total: habits.length },
      },
      message: "Today's habits retrieved",
    });
  } catch (error) {
    console.error("GET /api/v1/dashboard/today error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}
