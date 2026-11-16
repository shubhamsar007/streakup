"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Flame, CheckCircle2 } from "lucide-react";
import { LikeButton } from "./LikeButton";
import { CommentSection } from "./CommentSection";

interface FeedActivity {
  id: string;
  type: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    profile: { fullName: string | null; avatarUrl: string | null } | null;
  };
  habit: { id: string; name: string; category: string } | null;
  metadata: { habitName?: string; completedValue?: number | null; unit?: string | null } | null;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
}

interface Props {
  activity: FeedActivity;
  currentUserId: string;
}

export function ActivityCard({ activity, currentUserId }: Props) {
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(activity.commentCount);

  const user = activity.user;
  const displayName = user.profile?.fullName ?? user.username;
  const habitName = activity.habit?.name ?? activity.metadata?.habitName ?? "a habit";
  const unit = activity.metadata?.unit;
  const completedValue = activity.metadata?.completedValue;

  const description =
    activity.type === "HABIT_COMPLETED"
      ? completedValue != null && unit
        ? `completed ${habitName} — ${completedValue} ${unit}`
        : `completed ${habitName}`
      : `logged ${habitName}`;

  function handleCommentToggle() {
    setShowComments((prev) => {
      if (!prev) setCommentCount((c) => c); // just open
      return !prev;
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/u/${user.username}`} className="flex-shrink-0">
          <div className="h-9 w-9 rounded-full bg-secondary overflow-hidden">
            {user.profile?.avatarUrl ? (
              <img src={user.profile.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link href={`/u/${user.username}`} className="text-sm font-semibold hover:underline truncate">
              {displayName}
            </Link>
            <span className="text-xs text-muted-foreground">{description}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
          </p>
        </div>
        <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
      </div>

      {/* Habit pill */}
      {activity.habit && (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
            <Flame className="h-3 w-3 text-warning" />
            {activity.habit.name}
          </span>
          <span className="text-xs text-muted-foreground capitalize">{activity.habit.category.toLowerCase()}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/60">
        <LikeButton
          activityId={activity.id}
          initialCount={activity.likeCount}
          initialIsLiked={activity.isLiked}
        />
        <button
          onClick={handleCommentToggle}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span>{commentCount}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <CommentSection
          activityId={activity.id}
          currentUserId={currentUserId}
          activityOwnerId={user.id}
          initialComments={[]}
          initialNextCursor={null}
        />
      )}
    </div>
  );
}
