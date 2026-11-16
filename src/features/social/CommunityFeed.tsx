"use client";

import { useState, useTransition } from "react";
import { ActivityCard } from "./ActivityCard";
import { Loader2 } from "lucide-react";

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

type FeedType = "following" | "discover";

interface Props {
  initialActivities: FeedActivity[];
  initialNextCursor: string | null;
  feedType: FeedType;
  currentUserId: string;
  emptyMessage?: string;
}

export function CommunityFeed({
  initialActivities,
  initialNextCursor,
  feedType,
  currentUserId,
  emptyMessage = "Nothing here yet.",
}: Props) {
  const [activities, setActivities] = useState<FeedActivity[]>(initialActivities);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [isPending, startTransition] = useTransition();

  const endpoint = feedType === "following" ? "/api/v1/community/feed" : "/api/v1/community/discover";

  function loadMore() {
    if (!nextCursor || isPending) return;
    startTransition(async () => {
      try {
        const res = await fetch(`${endpoint}?cursor=${nextCursor}`);
        if (res.ok) {
          const json = await res.json();
          setActivities((prev) => [...prev, ...json.data.activities]);
          setNextCursor(json.data.nextCursor);
        }
      } catch {
        // silent
      }
    });
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} currentUserId={currentUserId} />
      ))}
      {nextCursor && (
        <div className="flex justify-center pt-2">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
