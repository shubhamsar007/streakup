import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPublicProfile } from "@/server/services/profileService";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

    const { username } = await params;
    const profile = await getPublicProfile(username, session.user.id);
    if (!profile) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } }, { status: 404 });

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error("GET /profiles/:username error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } }, { status: 500 });
  }
}
