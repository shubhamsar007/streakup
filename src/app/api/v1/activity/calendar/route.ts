import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getCalendarData,
  getUserHabitsForFilter,
  getCurrentYear,
} from "@/server/services/calendarService";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;
    const habitId = searchParams.get("habitId") ?? undefined;

    const userRow = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { timezone: true },
    });
    const timezone = userRow?.timezone ?? "UTC";

    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : getCurrentYear(timezone);

    if (isNaN(year) || year < 2020 || year > 2100) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_PARAM", message: "Invalid year" } },
        { status: 400 }
      );
    }

    const [calendarData, habits] = await Promise.all([
      getCalendarData(session.user.id, year, timezone, habitId),
      getUserHabitsForFilter(session.user.id),
    ]);

    return NextResponse.json({
      success: true,
      data: { calendarData, habits, year, currentYear: getCurrentYear(timezone) },
    });
  } catch (error) {
    console.error("GET /activity/calendar error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}
