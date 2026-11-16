import { prisma } from "@/lib/prisma";
import { getOverallStreak } from "./streakService";

export interface PublicProfile {
  id: string;
  username: string;
  createdAt: Date;
  profile: {
    fullName: string;
    bio: string | null;
    avatarUrl: string | null;
    visibility: "PUBLIC" | "PRIVATE";
  } | null;
  followersCount: number;
  followingCount: number;
  currentStreak: number;
  longestStreak: number;
  isOwnProfile: boolean;
  followStatus: "NONE" | "PENDING" | "ACCEPTED";
  isBlocked: boolean;
  canViewContent: boolean;
  habits: Array<{ id: string; name: string; category: string; trackingType: string }>;
  recentActivities: Array<{
    id: string;
    type: string;
    createdAt: Date;
    habit: { id: string; name: string } | null;
    metadata: Record<string, unknown> | null;
    likeCount: number;
    commentCount: number;
    isLiked: boolean;
  }>;
}

export async function getPublicProfile(
  username: string,
  viewerId?: string
): Promise<PublicProfile | null> {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      profile: {
        select: { fullName: true, bio: true, avatarUrl: true, visibility: true },
      },
      _count: {
        select: {
          followers: { where: { status: "ACCEPTED" } },
          follows: { where: { status: "ACCEPTED" } },
        },
      },
    },
  });

  if (!user || user.status === "SUSPENDED") return null;

  const isOwnProfile = viewerId === user.id;

  // Block check
  let isBlocked = false;
  let followStatus: "NONE" | "PENDING" | "ACCEPTED" = "NONE";

  if (viewerId && !isOwnProfile) {
    const [block, follow] = await Promise.all([
      prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: user.id, blockedId: viewerId },
            { blockerId: viewerId, blockedId: user.id },
          ],
        },
      }),
      prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
      }),
    ]);

    if (block) return null; // blocked — return null same as not found
    followStatus = (follow?.status as "PENDING" | "ACCEPTED") ?? "NONE";
  }

  const profileVisibility = (user.profile?.visibility ?? "PUBLIC") as "PUBLIC" | "PRIVATE";
  const canViewContent =
    isOwnProfile ||
    profileVisibility === "PUBLIC" ||
    followStatus === "ACCEPTED";

  // Streak data
  let currentStreak = 0;
  let longestStreak = 0;
  if (canViewContent) {
    const userRow = await prisma.user.findUnique({
      where: { id: user.id },
      select: { timezone: true },
    });
    const streak = await getOverallStreak(user.id, userRow?.timezone ?? "UTC");
    currentStreak = streak.current;
    longestStreak = streak.longest;
  }

  // Habits (public only unless own profile)
  const habits = canViewContent
    ? await prisma.habit.findMany({
        where: {
          userId: user.id,
          status: "ACTIVE",
          ...(isOwnProfile ? {} : { visibility: "PUBLIC" }),
        },
        select: { id: true, name: true, category: true, trackingType: true },
        orderBy: { createdAt: "asc" },
        take: 10,
      })
    : [];

  // Recent activities
  const activitiesRaw = canViewContent
    ? await prisma.activity.findMany({
        where: {
          userId: user.id,
          ...(isOwnProfile ? {} : { visibility: "PUBLIC" }),
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          habit: { select: { id: true, name: true } },
          _count: { select: { likes: true, comments: true } },
          ...(viewerId
            ? { likes: { where: { userId: viewerId }, select: { id: true } } }
            : {}),
        },
      })
    : [];

  const recentActivities = activitiesRaw.map((a) => ({
    id: a.id,
    type: a.type as string,
    createdAt: a.createdAt,
    habit: a.habit,
    metadata: (a.metadata as Record<string, unknown>) ?? null,
    likeCount: a._count.likes,
    commentCount: a._count.comments,
    isLiked: "likes" in a ? (a.likes as { id: string }[]).length > 0 : false,
  }));

  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
    profile: user.profile
      ? {
          fullName: user.profile.fullName,
          bio: user.profile.bio,
          avatarUrl: user.profile.avatarUrl,
          visibility: user.profile.visibility as "PUBLIC" | "PRIVATE",
        }
      : null,
    followersCount: user._count.followers,
    followingCount: user._count.follows,
    currentStreak,
    longestStreak,
    isOwnProfile,
    followStatus,
    isBlocked,
    canViewContent,
    habits,
    recentActivities,
  };
}

export async function searchUsers(query: string, viewerId: string) {
  const q = query.trim();
  if (!q) return [];

  const users = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { username: { contains: q, mode: "insensitive" } },
        { profile: { fullName: { contains: q, mode: "insensitive" } } },
      ],
      // Exclude blocked in either direction
      blocks: { none: { blockedId: viewerId } },
      blockedBy: { none: { blockerId: viewerId } },
    },
    select: {
      id: true,
      username: true,
      profile: { select: { fullName: true, avatarUrl: true } },
      followers: {
        where: { followerId: viewerId },
        select: { status: true },
      },
    },
    take: 20,
  });

  return users.map((u) => ({
    id: u.id,
    username: u.username,
    profile: u.profile,
    followStatus: (u.followers[0]?.status ?? "NONE") as "NONE" | "PENDING" | "ACCEPTED",
  }));
}
