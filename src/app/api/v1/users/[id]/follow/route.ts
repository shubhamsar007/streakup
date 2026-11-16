import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { followUser, unfollowUser, FollowServiceError } from "@/server/services/followService";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

    const { id } = await params;
    const result = await followUser(session.user.id, id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof FollowServiceError) {
      const status = ["NOT_FOUND", "USER_NOT_FOUND"].includes(error.code) ? 404
        : error.code === "ALREADY_FOLLOWING" ? 409
        : 403;
      return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status });
    }
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

    const { id } = await params;
    await unfollowUser(session.user.id, id);
    return NextResponse.json({ success: true, data: { message: "Unfollowed" } });
  } catch (error) {
    if (error instanceof FollowServiceError) {
      return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } }, { status: 500 });
  }
}
