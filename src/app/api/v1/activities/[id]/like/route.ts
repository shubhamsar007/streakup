import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { likeActivity, unlikeActivity } from "@/server/services/likeService";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

    const { id } = await params;
    const result = await likeActivity(id, session.user.id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("POST /activities/:id/like error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

    const { id } = await params;
    const result = await unlikeActivity(id, session.user.id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("DELETE /activities/:id/like error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } }, { status: 500 });
  }
}
