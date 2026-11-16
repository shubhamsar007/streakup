import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const onboardingSchema = z.object({
  fullName: z.string().min(2).max(100),
  bio: z.string().max(160).optional(),
  timezone: z.string(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});

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
    const data = onboardingSchema.parse(body);

    await prisma.$transaction(async (tx) => {
      // Create or update profile
      await tx.profile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          fullName: data.fullName,
          bio: data.bio,
          visibility: data.visibility,
        },
        update: {
          fullName: data.fullName,
          bio: data.bio,
          visibility: data.visibility,
        },
      });

      // Update user timezone and mark onboarding complete
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          timezone: data.timezone,
          onboardingDone: true,
        },
      });
    });

    return NextResponse.json({ success: true, data: null, message: "Onboarding complete" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues ?? [];
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: issues[0]?.message ?? "Invalid input" } },
        { status: 400 }
      );
    }
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}
