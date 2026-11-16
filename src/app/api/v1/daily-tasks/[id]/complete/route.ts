import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import * as taskService from "@/server/services/taskService";

// PATCH /api/v1/daily-tasks/:id/complete  — toggle complete/undo
export async function PATCH(
  request: NextRequest,
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

    // Read optional undo flag from body
    let undo = false;
    try {
      const body = await request.json();
      undo = body?.undo === true;
    } catch {
      // empty body is fine
    }

    const task = undo
      ? await taskService.undoCompleteTask(id, session.user.id)
      : await taskService.completeTask(id, session.user.id);

    if (!task) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Task not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: task,
      message: undo ? "Task marked as pending" : "Task completed",
    });
  } catch (error) {
    console.error("PATCH /daily-tasks/:id/complete error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}
