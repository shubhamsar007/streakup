import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/permissions/requireAdmin";
import { updateUserStatus, AdminServiceError } from "@/server/services/adminService";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (status !== "ACTIVE" && status !== "SUSPENDED") {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "status must be ACTIVE or SUSPENDED" } }, { status: 400 });
    }

    await updateUserStatus(id, status, auth.userId);
    return NextResponse.json({ success: true, data: { message: `User ${status.toLowerCase()}` } });
  } catch (error) {
    if (error instanceof AdminServiceError) {
      const status = error.code === "NOT_FOUND" ? 404 : error.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status });
    }
    console.error("PATCH /admin/users/:id/status error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } }, { status: 500 });
  }
}
