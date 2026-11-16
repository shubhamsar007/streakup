import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createReport, ReportServiceError } from "@/server/services/reportService";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

    const body = await request.json();
    const { targetType, targetId, reason } = body;

    if (!targetType || !targetId || !reason) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "targetType, targetId, and reason are required" } }, { status: 400 });
    }

    await createReport(session.user.id, targetType, targetId, reason);
    return NextResponse.json({ success: true, data: { message: "Report submitted" } }, { status: 201 });
  } catch (error) {
    if (error instanceof ReportServiceError) {
      const status = error.code === "DUPLICATE" ? 409 : 400;
      return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status });
    }
    console.error("POST /reports error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } }, { status: 500 });
  }
}
