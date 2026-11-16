import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getComments, addComment } from "@/server/services/commentService";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

    const { id } = await params;
    const cursor = request.nextUrl.searchParams.get("cursor") ?? undefined;
    const result = await getComments(id, session.user.id, cursor);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("GET /activities/:id/comments error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { content } = body;
    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Comment content is required" } }, { status: 400 });
    }

    const comment = await addComment(id, session.user.id, content);
    return NextResponse.json({ success: true, data: comment }, { status: 201 });
  } catch (error) {
    console.error("POST /activities/:id/comments error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } }, { status: 500 });
  }
}
