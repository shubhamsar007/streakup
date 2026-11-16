import { prisma } from "@/lib/prisma";

export class AdminServiceError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "AdminServiceError";
  }
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalHabits: number;
  totalCompletions: number;
  totalActivities: number;
  pendingReports: number;
  recentRegistrations: Array<{
    id: string;
    username: string;
    email: string;
    status: string;
    createdAt: Date;
    profile: { fullName: string; avatarUrl: string | null } | null;
  }>;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    totalHabits,
    totalCompletions,
    totalActivities,
    pendingReports,
    recentRegistrations,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { status: "SUSPENDED" } }),
    prisma.habit.count(),
    prisma.habitCompletion.count(),
    prisma.activity.count(),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        username: true,
        email: true,
        status: true,
        createdAt: true,
        profile: { select: { fullName: true, avatarUrl: true } },
      },
    }),
  ]);

  return {
    totalUsers,
    activeUsers,
    suspendedUsers,
    totalHabits,
    totalCompletions,
    totalActivities,
    pendingReports,
    recentRegistrations,
  };
}

// ─── User management ──────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
  profile: { fullName: string; avatarUrl: string | null } | null;
  _count: { habits: number; activities: number; followers: number };
}

export async function getAdminUsers(
  search?: string,
  cursor?: string,
  pageSize = 20
): Promise<{ users: AdminUser[]; nextCursor: string | null }> {
  const rows = await prisma.user.findMany({
    take: pageSize + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    where: search
      ? {
          OR: [
            { username: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { profile: { fullName: { contains: search, mode: "insensitive" } } },
          ],
        }
      : undefined,
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      profile: { select: { fullName: true, avatarUrl: true } },
      _count: { select: { habits: true, activities: true, followers: true } },
    },
  });

  const hasMore = rows.length > pageSize;
  const items = hasMore ? rows.slice(0, pageSize) : rows;

  return {
    users: items as AdminUser[],
    nextCursor: hasMore ? items[items.length - 1]!.id : null,
  };
}

export async function updateUserStatus(
  targetId: string,
  status: "ACTIVE" | "SUSPENDED",
  adminId: string
): Promise<void> {
  if (targetId === adminId) {
    throw new AdminServiceError("SELF_ACTION", "Cannot change your own status");
  }

  const user = await prisma.user.findUnique({ where: { id: targetId } });
  if (!user) throw new AdminServiceError("NOT_FOUND", "User not found");
  if (user.role === "ADMIN") {
    throw new AdminServiceError("FORBIDDEN", "Cannot suspend another admin");
  }

  await prisma.user.update({
    where: { id: targetId },
    data: { status },
  });
}

// ─── Reports management ───────────────────────────────────────────────────────

export interface AdminReport {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: Date;
  reviewedAt: Date | null;
  reporter: {
    id: string;
    username: string;
    profile: { fullName: string } | null;
  };
}

export async function getAdminReports(
  status?: string,
  cursor?: string,
  pageSize = 20
): Promise<{ reports: AdminReport[]; nextCursor: string | null }> {
  const rows = await prisma.report.findMany({
    take: pageSize + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    where: status ? { status: status as "PENDING" | "REVIEWED" | "DISMISSED" | "ACTIONED" } : undefined,
    include: {
      reporter: {
        select: {
          id: true,
          username: true,
          profile: { select: { fullName: true } },
        },
      },
    },
  });

  const hasMore = rows.length > pageSize;
  const items = hasMore ? rows.slice(0, pageSize) : rows;

  return {
    reports: items as AdminReport[],
    nextCursor: hasMore ? items[items.length - 1]!.id : null,
  };
}

export async function reviewReport(
  reportId: string,
  newStatus: "REVIEWED" | "DISMISSED" | "ACTIONED"
): Promise<void> {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw new AdminServiceError("NOT_FOUND", "Report not found");

  await prisma.report.update({
    where: { id: reportId },
    data: { status: newStatus, reviewedAt: new Date() },
  });
}

export async function deleteContent(
  targetType: string,
  targetId: string
): Promise<void> {
  if (targetType === "activity") {
    await prisma.activity.delete({ where: { id: targetId } });
  } else if (targetType === "comment") {
    await prisma.comment.delete({ where: { id: targetId } });
  } else {
    throw new AdminServiceError("INVALID_TYPE", "Unknown content type");
  }
}
