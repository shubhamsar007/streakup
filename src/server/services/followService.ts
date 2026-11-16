import { prisma } from "@/lib/prisma";

export class FollowServiceError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "FollowServiceError";
  }
}

/**
 * Follow a user. If their profile is PRIVATE → PENDING + FOLLOW_REQUEST notification.
 * If PUBLIC → ACCEPTED + NEW_FOLLOWER notification.
 */
export async function followUser(
  followerId: string,
  followingId: string
): Promise<{ status: "PENDING" | "ACCEPTED" }> {
  if (followerId === followingId) {
    throw new FollowServiceError("SELF_FOLLOW", "Cannot follow yourself");
  }

  // Check target user exists, is active, and not blocked
  const target = await prisma.user.findUnique({
    where: { id: followingId },
    include: {
      profile: { select: { visibility: true } },
      blocks: { where: { blockedId: followerId } },
      blockedBy: { where: { blockerId: followerId } },
    },
  });

  if (!target) throw new FollowServiceError("USER_NOT_FOUND", "User not found");
  if (target.status === "SUSPENDED") throw new FollowServiceError("SUSPENDED", "User is suspended");
  if (target.blocks.length > 0 || target.blockedBy.length > 0) {
    throw new FollowServiceError("BLOCKED", "Cannot follow this user");
  }

  // Check not already following
  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  if (existing) throw new FollowServiceError("ALREADY_FOLLOWING", "Already following");

  const isPrivate = target.profile?.visibility === "PRIVATE";
  const status: "PENDING" | "ACCEPTED" = isPrivate ? "PENDING" : "ACCEPTED";

  await prisma.$transaction([
    prisma.follow.create({ data: { followerId, followingId, status } }),
    prisma.notification.create({
      data: {
        userId: followingId,
        actorId: followerId,
        type: isPrivate ? "FOLLOW_REQUEST" : "NEW_FOLLOWER",
        entityId: followerId,
      },
    }),
  ]);

  return { status };
}

/** Unfollow or cancel a follow request. */
export async function unfollowUser(
  followerId: string,
  followingId: string
): Promise<void> {
  if (followerId === followingId) {
    throw new FollowServiceError("SELF_FOLLOW", "Cannot unfollow yourself");
  }

  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  if (!follow) throw new FollowServiceError("NOT_FOLLOWING", "Not following this user");

  await prisma.follow.delete({
    where: { followerId_followingId: { followerId, followingId } },
  });
}

/**
 * Accept a follow request (called by the target — followingId — to accept followerId's request).
 */
export async function acceptFollowRequest(
  followerId: string,
  followingId: string
): Promise<void> {
  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  if (!follow || follow.status !== "PENDING") {
    throw new FollowServiceError("REQUEST_NOT_FOUND", "Follow request not found");
  }

  await prisma.$transaction([
    prisma.follow.update({
      where: { followerId_followingId: { followerId, followingId } },
      data: { status: "ACCEPTED" },
    }),
    prisma.notification.create({
      data: {
        userId: followerId,
        actorId: followingId,
        type: "FOLLOW_REQUEST_ACCEPTED",
        entityId: followingId,
      },
    }),
  ]);
}

/** Reject a follow request (delete the pending follow). */
export async function rejectFollowRequest(
  followerId: string,
  followingId: string
): Promise<void> {
  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  if (!follow || follow.status !== "PENDING") {
    throw new FollowServiceError("REQUEST_NOT_FOUND", "Follow request not found");
  }
  await prisma.follow.delete({
    where: { followerId_followingId: { followerId, followingId } },
  });
}

export async function getFollowStatus(
  followerId: string,
  followingId: string
): Promise<"NONE" | "PENDING" | "ACCEPTED"> {
  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  if (!follow) return "NONE";
  return follow.status as "PENDING" | "ACCEPTED";
}

export async function getFollowers(userId: string) {
  const follows = await prisma.follow.findMany({
    where: { followingId: userId, status: "ACCEPTED" },
    include: {
      follower: {
        select: {
          id: true,
          username: true,
          profile: { select: { fullName: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return follows.map((f) => f.follower);
}

export async function getFollowing(userId: string) {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId, status: "ACCEPTED" },
    include: {
      following: {
        select: {
          id: true,
          username: true,
          profile: { select: { fullName: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return follows.map((f) => f.following);
}
