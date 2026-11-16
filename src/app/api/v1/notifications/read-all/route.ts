import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { markAllAsRead } from "@/server/services/notificationService";

export async function PATCH() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

    await markAllAsRead(session.user.id);
    return NextResponse.json({ success: true, data: { message: "All notifications marked as read" } });
  } catch (error) {
    console.error("PATCH /notifications/read-all error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } }, { status: 500 });
  }
}
