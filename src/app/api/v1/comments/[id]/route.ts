import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { editComment, deleteComment } from "@/server/services/commentService";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { content } = body;
    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Comment content is required" } }, { status: 400 });
    }

    const comment = await editComment(id, session.user.id, content);
    return NextResponse.json({ success: true, data: comment });
  } catch (error) {
    console.error("PATCH /comments/:id error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

    const { id } = await params;
    await deleteComment(id, session.user.id);
    return NextResponse.json({ success: true, data: { message: "Deleted" } });
  } catch (error) {
    console.error("DELETE /comments/:id error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } }, { status: 500 });
  }
}
