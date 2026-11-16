import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUnreadCount } from "@/server/services/notificationService";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

    const count = await getUnreadCount(session.user.id);
    return NextResponse.json({ success: true, data: { count } });
  } catch (error) {
    console.error("GET /notifications/unread-count error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } }, { status: 500 });
  }
}
