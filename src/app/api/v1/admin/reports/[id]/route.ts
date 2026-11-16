import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/permissions/requireAdmin";
import { reviewReport, deleteContent, AdminServiceError } from "@/server/services/adminService";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, deleteTarget, targetType, targetId } = body;

    const validStatuses = ["REVIEWED", "DISMISSED", "ACTIONED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid status" } }, { status: 400 });
    }

    await reviewReport(id, status);

    // Optionally delete the reported content
    if (deleteTarget && targetType && targetId) {
      await deleteContent(targetType, targetId);
    }

    return NextResponse.json({ success: true, data: { message: "Report updated" } });
  } catch (error) {
    if (error instanceof AdminServiceError) {
      return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: 404 });
    }
    console.error("PATCH /admin/reports/:id error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } }, { status: 500 });
  }
}
