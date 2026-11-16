import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { searchUsers } from "@/server/services/profileService";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

    const q = request.nextUrl.searchParams.get("q") ?? "";
    if (!q.trim()) return NextResponse.json({ success: true, data: [] });

    const users = await searchUsers(q, session.user.id);
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("GET /users/search error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } }, { status: 500 });
  }
}
