import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/permissions/requireAdmin";
import { getAdminReports } from "@/server/services/adminService";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const status = request.nextUrl.searchParams.get("status") ?? undefined;
    const cursor = request.nextUrl.searchParams.get("cursor") ?? undefined;
    const result = await getAdminReports(status, cursor);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("GET /admin/reports error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } }, { status: 500 });
  }
}
