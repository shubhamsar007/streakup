import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 30;

export interface NotificationItem {
  id: string;
  type: string;
  entityId: string | null;
  isRead: boolean;
  createdAt: Date;
  actor: {
    id: string;
    username: string;
    profile: { fullName: string; avatarUrl: string | null } | null;
  } | null;
}

export interface NotificationsResult {
  notifications: NotificationItem[];
  nextCursor: string | null;
  unreadCount: number;
}

export async function getNotifications(
  userId: string,
  cursor?: string
): Promise<NotificationsResult> {
  const [rows, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      take: PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            profile: { select: { fullName: true, avatarUrl: true } },
          },
        },
      },
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  const hasMore = rows.length > PAGE_SIZE;
  const items = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  return {
    notifications: items as NotificationItem[],
    nextCursor: hasMore ? items[items.length - 1]!.id : null,
    unreadCount,
  };
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export async function markAsRead(notificationId: string, userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
}

export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
