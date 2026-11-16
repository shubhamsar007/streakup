import { prisma } from "@/lib/prisma";

export class CommentServiceError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "CommentServiceError";
  }
}

const MAX_LENGTH = 500;
const COMMENT_PAGE_SIZE = 50;

const commentInclude = {
  user: {
    select: {
      id: true,
      username: true,
      profile: { select: { fullName: true, avatarUrl: true } },
    },
  },
} as const;

export interface CommentWithUser {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    username: string;
    profile: { fullName: string; avatarUrl: string | null } | null;
  };
}

function validate(content: string) {
  if (!content.trim()) throw new CommentServiceError("EMPTY", "Comment cannot be empty");
  if (content.length > MAX_LENGTH) throw new CommentServiceError("TOO_LONG", `Max ${MAX_LENGTH} characters`);
}

async function getActivityWithPermission(activityId: string, userId: string) {
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
  if (!activity) throw new CommentServiceError("ACTIVITY_NOT_FOUND", "Activity not found");
  if (activity.user.status === "SUSPENDED") throw new CommentServiceError("ACTIVITY_NOT_FOUND", "Activity not found");

  const isOwn = activity.userId === userId;
  if (!isOwn) {
    if (activity.visibility === "PRIVATE") throw new CommentServiceError("NOT_PERMITTED", "Cannot interact");
    if (activity.visibility === "FOLLOWERS" && activity.user.followers.length === 0) {
      throw new CommentServiceError("NOT_PERMITTED", "Cannot interact");
    }
  }
  return activity;
}

export async function getComments(
  activityId: string,
  _viewerId?: string,
  cursor?: string
): Promise<{ comments: CommentWithUser[]; nextCursor: string | null }> {
  const rows = await prisma.comment.findMany({
    where: { activityId },
    take: COMMENT_PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "asc" },
    include: commentInclude,
  });

  const hasMore = rows.length > COMMENT_PAGE_SIZE;
  const items = hasMore ? rows.slice(0, COMMENT_PAGE_SIZE) : rows;
  return {
    comments: items as CommentWithUser[],
    nextCursor: hasMore ? items[items.length - 1]!.id : null,
  };
}

export async function addComment(
  activityId: string,
  userId: string,
  content: string
): Promise<CommentWithUser> {
  validate(content);
  const activity = await getActivityWithPermission(activityId, userId);

  const comment = await prisma.$transaction(async (tx) => {
    const c = await tx.comment.create({
      data: { activityId, userId, content: content.trim() },
      include: commentInclude,
    });

    if (activity.userId !== userId) {
      await tx.notification.create({
        data: {
          userId: activity.userId,
          actorId: userId,
          type: "ACTIVITY_COMMENTED",
          entityId: activityId,
        },
      });
    }
    return c;
  });

  return comment as CommentWithUser;
}

export async function editComment(
  commentId: string,
  userId: string,
  content: string
): Promise<CommentWithUser> {
  validate(content);

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new CommentServiceError("NOT_FOUND", "Comment not found");
  if (comment.userId !== userId) throw new CommentServiceError("FORBIDDEN", "Cannot edit this comment");

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { content: content.trim() },
    include: commentInclude,
  });

  return updated as CommentWithUser;
}

export async function deleteComment(commentId: string, userId: string): Promise<void> {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { activity: { select: { userId: true } } },
  });
  if (!comment) throw new CommentServiceError("NOT_FOUND", "Comment not found");

  const isOwn = comment.userId === userId;
  const isActivityOwner = comment.activity.userId === userId;
  if (!isOwn && !isActivityOwner) {
    throw new CommentServiceError("FORBIDDEN", "Cannot delete this comment");
  }

  await prisma.comment.delete({ where: { id: commentId } });
}
