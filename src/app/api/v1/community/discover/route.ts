import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDiscoverFeed } from "@/server/services/feedService";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

    const cursor = request.nextUrl.searchParams.get("cursor") ?? undefined;
    const result = await getDiscoverFeed(session.user.id, cursor);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("GET /community/discover error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } }, { status: 500 });
  }
}
