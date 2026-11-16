import { prisma } from "@/lib/prisma";

export class LikeServiceError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "LikeServiceError";
  }
}

async function checkActivityPermission(activityId: string, userId: string) {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: {
      id: true,
      userId: true,
      visibility: true,
      user: {
        select: {
          status: true,
          followers: {
            where: { followerId: userId, status: "ACCEPTED" },
            select: { id: true },
          },
        },
      },
    },
  });
  if (!activity) throw new LikeServiceError("ACTIVITY_NOT_FOUND", "Activity not found");
  if (activity.user.status === "SUSPENDED") throw new LikeServiceError("ACTIVITY_NOT_FOUND", "Activity not found");

  const isOwn = activity.userId === userId;
  if (isOwn) return activity;

  if (activity.visibility === "PRIVATE") {
    throw new LikeServiceError("NOT_PERMITTED", "Cannot interact with this activity");
  }
  if (activity.visibility === "FOLLOWERS" && activity.user.followers.length === 0) {
    throw new LikeServiceError("NOT_PERMITTED", "Cannot interact with this activity");
  }

  return activity;
}

export async function likeActivity(
  activityId: string,
  userId: string
): Promise<{ likeCount: number }> {
  const activity = await checkActivityPermission(activityId, userId);

  const existing = await prisma.like.findUnique({
    where: { activityId_userId: { activityId, userId } },
  });
  if (existing) throw new LikeServiceError("ALREADY_LIKED", "Already liked");

  await prisma.$transaction(async (tx) => {
    await tx.like.create({ data: { activityId, userId } });

    if (activity.userId !== userId) {
      await tx.notification.create({
        data: {
          userId: activity.userId,
          actorId: userId,
          type: "ACTIVITY_LIKED",
          entityId: activityId,
        },
      });
    }
  });

  const likeCount = await prisma.like.count({ where: { activityId } });
  return { likeCount };
}

export async function unlikeActivity(
  activityId: string,
  userId: string
): Promise<{ likeCount: number }> {
  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity) throw new LikeServiceError("ACTIVITY_NOT_FOUND", "Activity not found");

  const existing = await prisma.like.findUnique({
    where: { activityId_userId: { activityId, userId } },
  });
  if (!existing) throw new LikeServiceError("NOT_LIKED", "Not liked");

  await prisma.like.delete({ where: { activityId_userId: { activityId, userId } } });

  const likeCount = await prisma.like.count({ where: { activityId } });
  return { likeCount };
}
