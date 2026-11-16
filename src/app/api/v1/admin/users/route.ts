import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/permissions/requireAdmin";
import { getAdminUsers } from "@/server/services/adminService";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const search = request.nextUrl.searchParams.get("q") ?? undefined;
    const cursor = request.nextUrl.searchParams.get("cursor") ?? undefined;
    const result = await getAdminUsers(search, cursor);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("GET /admin/users error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } }, { status: 500 });
  }
}
