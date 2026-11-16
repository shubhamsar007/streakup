import { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getNotifications } from "@/server/services/notificationService";
import { NotificationsList } from "@/features/notifications/NotificationsList";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const result = await getNotifications(session.user.id);

  const serialized = result.notifications.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          {result.unreadCount > 0 && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {result.unreadCount} unread
            </p>
          )}
        </div>
      </div>

      <NotificationsList
        initialNotifications={serialized}
        initialNextCursor={result.nextCursor}
        initialUnreadCount={result.unreadCount}
      />
    </div>
  );
}
