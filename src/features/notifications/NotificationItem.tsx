"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, UserPlus, UserCheck, Trophy, Bell, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
  notification: Notification;
  onRead: (id: string) => void;
}

const typeConfig: Record<
  string,
  { icon: React.ElementType; color: string; getMessage: (name: string) => string; getHref?: (entityId: string | null, actorUsername: string) => string }
> = {
  NEW_FOLLOWER: {
    icon: UserPlus,
    color: "text-primary",
    getMessage: (name) => `${name} started following you`,
    getHref: (_e, actor) => `/u/${actor}`,
  },
  FOLLOW_REQUEST: {
    icon: UserPlus,
    color: "text-warning",
    getMessage: (name) => `${name} wants to follow you`,
    getHref: (_e, actor) => `/u/${actor}`,
  },
  FOLLOW_REQUEST_ACCEPTED: {
    icon: UserCheck,
    color: "text-success",
    getMessage: (name) => `${name} accepted your follow request`,
    getHref: (_e, actor) => `/u/${actor}`,
  },
  ACTIVITY_LIKED: {
    icon: Heart,
    color: "text-red-400",
    getMessage: (name) => `${name} liked your activity`,
    getHref: (entityId) => entityId ? `/community` : `/community`,
  },
  ACTIVITY_COMMENTED: {
    icon: MessageCircle,
    color: "text-blue-400",
    getMessage: (name) => `${name} commented on your activity`,
    getHref: (entityId) => entityId ? `/community` : `/community`,
  },
  STREAK_MILESTONE: {
    icon: Trophy,
    color: "text-warning",
    getMessage: () => `You reached a streak milestone!`,
  },
};

export function NotificationItem({ notification, onRead }: Props) {
  const [requestStatus, setRequestStatus] = useState<"pending" | "accepted" | "rejected" | null>(
    notification.type === "FOLLOW_REQUEST" ? "pending" : null
  );
  const config = typeConfig[notification.type];
  const actorName = notification.actor?.profile?.fullName ?? notification.actor?.username ?? "Someone";
  const actorUsername = notification.actor?.username ?? "";
  const Icon = config?.icon ?? Bell;
  const iconColor = config?.color ?? "text-muted-foreground";
  const message = config?.getMessage(actorName) ?? "New notification";
  const href = config?.getHref?.(notification.entityId, actorUsername);

  function handleClick() {
    if (!notification.isRead) {
      onRead(notification.id);
    }
  }

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg p-3 transition-colors",
        !notification.isRead ? "bg-primary/5 hover:bg-primary/8" : "hover:bg-secondary/50"
      )}
      onClick={handleClick}
    >
      {/* Actor avatar or type icon */}
      <div className="relative flex-shrink-0">
        <div className="h-9 w-9 rounded-full bg-secondary overflow-hidden">
          {notification.actor?.profile?.avatarUrl ? (
            <img
              src={notification.actor.profile.avatarUrl}
              alt={actorName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground">
              {notification.actor ? actorName.charAt(0).toUpperCase() : <Bell className="h-4 w-4" />}
            </span>
          )}
        </div>
        <div className={cn("absolute -bottom-0.5 -right-0.5 rounded-full bg-background p-0.5", iconColor)}>
          <Icon className="h-3 w-3" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm", !notification.isRead ? "text-foreground font-medium" : "text-foreground/80")}>
          {message}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.isRead && (
        <div className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
      )}

      {/* Follow request accept/reject */}
      {notification.type === "FOLLOW_REQUEST" && notification.actor && requestStatus === "pending" && (
        <div className="flex gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={async () => {
              await fetch(`/api/v1/users/${notification.actor!.id}/follow/accept`, { method: "POST" });
              setRequestStatus("accepted");
              onRead(notification.id);
            }}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Check className="h-3 w-3" /> Accept
          </button>
          <button
            onClick={async () => {
              await fetch(`/api/v1/users/${notification.actor!.id}/follow/reject`, { method: "POST" });
              setRequestStatus("rejected");
              onRead(notification.id);
            }}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <X className="h-3 w-3" /> Decline
          </button>
        </div>
      )}
      {notification.type === "FOLLOW_REQUEST" && requestStatus === "accepted" && (
        <span className="text-xs text-success flex-shrink-0">Accepted</span>
      )}
      {notification.type === "FOLLOW_REQUEST" && requestStatus === "rejected" && (
        <span className="text-xs text-muted-foreground flex-shrink-0">Declined</span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block cursor-pointer">
        {content}
      </Link>
    );
  }

  return <div className="cursor-pointer">{content}</div>;
}
