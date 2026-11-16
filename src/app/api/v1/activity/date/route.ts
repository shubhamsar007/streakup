import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDateDetail } from "@/server/services/calendarService";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const dateStr = request.nextUrl.searchParams.get("date");
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_PARAM", message: "date must be YYYY-MM-DD" } },
        { status: 400 }
      );
    }

    const userRow = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { timezone: true },
    });
    const timezone = userRow?.timezone ?? "UTC";

    const detail = await getDateDetail(session.user.id, dateStr, timezone);
    return NextResponse.json({ success: true, data: detail });
  } catch (error) {
    console.error("GET /activity/date error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}
