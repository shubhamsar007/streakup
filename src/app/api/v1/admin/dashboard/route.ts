import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/permissions/requireAdmin";
import { getAdminDashboardStats } from "@/server/services/adminService";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const stats = await getAdminDashboardStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error("GET /admin/dashboard error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } }, { status: 500 });
  }
}
