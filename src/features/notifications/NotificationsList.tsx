"use client";

import { useState, useTransition } from "react";
import { NotificationItem } from "./NotificationItem";
import { CheckCheck, Loader2 } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    profile: { fullName: string | null; avatarUrl: string | null } | null;
  } | null;
}

interface Props {
  initialNotifications: Notification[];
  initialNextCursor: string | null;
  initialUnreadCount: number;
}

export function NotificationsList({
  initialNotifications,
  initialNextCursor,
  initialUnreadCount,
}: Props) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    fetch(`/api/v1/notifications/${id}/read`, { method: "PATCH" }).catch(() => {});
  }

  function handleMarkAllRead() {
    if (isPending || unreadCount === 0) return;
    startTransition(async () => {
      try {
        await fetch("/api/v1/notifications/read-all", { method: "PATCH" });
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      } catch {
        // silent
      }
    });
  }

  async function loadMore() {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await fetch(`/api/v1/notifications?cursor=${nextCursor}`);
      if (res.ok) {
        const json = await res.json();
        setNotifications((prev) => [...prev, ...json.data.notifications]);
        setNextCursor(json.data.nextCursor);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3">
          <CheckCheck className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-medium text-foreground">You&apos;re all caught up</p>
        <p className="text-sm text-muted-foreground mt-1">No notifications yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Header actions */}
      {unreadCount > 0 && (
        <div className="flex justify-end pb-2">
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all as read
          </button>
        </div>
      )}

      {/* List */}
      <div className="space-y-0.5">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRead={handleRead}
          />
        ))}
      </div>

      {/* Load more */}
      {nextCursor && (
        <div className="flex justify-center pt-4">
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {isLoadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
