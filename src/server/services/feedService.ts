import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

export interface FeedActivity {
  id: string;
  type: "HABIT_COMPLETED" | "STREAK_MILESTONE";
  createdAt: Date;
  user: {
    id: string;
    username: string;
    profile: { fullName: string; avatarUrl: string | null } | null;
  };
  habit: { id: string; name: string; category: string } | null;
  metadata: Record<string, unknown> | null;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
}

export interface FeedResult {
  activities: FeedActivity[];
  nextCursor: string | null;
}

function mapActivity(
  a: {
    id: string;
    type: string;
    createdAt: Date;
    metadata: unknown;
    user: {
      id: string;
      username: string;
      profile: { fullName: string; avatarUrl: string | null } | null;
    };
    habit: { id: string; name: string; category: string } | null;
    _count: { likes: number; comments: number };
    likes: { id: string }[];
  }
): FeedActivity {
  return {
    id: a.id,
    type: a.type as "HABIT_COMPLETED" | "STREAK_MILESTONE",
    createdAt: a.createdAt,
    user: a.user,
    habit: a.habit,
    metadata: (a.metadata as Record<string, unknown>) ?? null,
    likeCount: a._count.likes,
    commentCount: a._count.comments,
    isLiked: a.likes.length > 0,
  };
}

/** Feed from users the viewer follows (PUBLIC + FOLLOWERS visibility). */
export async function getFollowingFeed(
  viewerId: string,
  cursor?: string
): Promise<FeedResult> {
  const rows = await prisma.activity.findMany({
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    where: {
      visibility: { in: ["PUBLIC", "FOLLOWERS"] },
      user: {
        status: "ACTIVE",
        followers: { some: { followerId: viewerId, status: "ACCEPTED" } },
        blocks: { none: { blockedId: viewerId } },
        blockedBy: { none: { blockerId: viewerId } },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          profile: { select: { fullName: true, avatarUrl: true } },
        },
      },
      habit: { select: { id: true, name: true, category: true } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId: viewerId }, select: { id: true } },
    },
  });

  const hasMore = rows.length > PAGE_SIZE;
  const items = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const nextCursor = hasMore ? items[items.length - 1]!.id : null;

  return { activities: items.map(mapActivity), nextCursor };
}

/** All public activities from active, non-blocked users (Discover tab). */
export async function getDiscoverFeed(
  viewerId: string,
  cursor?: string
): Promise<FeedResult> {
  const rows = await prisma.activity.findMany({
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    where: {
      visibility: "PUBLIC",
      user: {
        status: "ACTIVE",
        blocks: { none: { blockedId: viewerId } },
        blockedBy: { none: { blockerId: viewerId } },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          profile: { select: { fullName: true, avatarUrl: true } },
        },
      },
      habit: { select: { id: true, name: true, category: true } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId: viewerId }, select: { id: true } },
    },
  });

  const hasMore = rows.length > PAGE_SIZE;
  const items = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const nextCursor = hasMore ? items[items.length - 1]!.id : null;

  return { activities: items.map(mapActivity), nextCursor };
}
