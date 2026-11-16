import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import * as taskService from "@/server/services/taskService";
import { createTaskSchema } from "@/server/validators/taskValidators";

// GET /api/v1/daily-tasks?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const date = request.nextUrl.searchParams.get("date");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Valid date query param required (YYYY-MM-DD)" } },
        { status: 400 }
      );
    }

    const tasks = await taskService.getTasksForDate(session.user.id, date);
    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    console.error("GET /daily-tasks error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}

// POST /api/v1/daily-tasks
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = createTaskSchema.parse(body);

    const task = await taskService.createTask(session.user.id, data);
    return NextResponse.json({ success: true, data: task, message: "Task created" }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: error.issues[0]?.message ?? "Invalid input" } },
        { status: 400 }
      );
    }
    console.error("POST /daily-tasks error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}
