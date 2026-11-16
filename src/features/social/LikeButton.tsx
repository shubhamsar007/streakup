"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  activityId: string;
  initialCount: number;
  initialIsLiked: boolean;
}

export function LikeButton({ activityId, initialCount, initialIsLiked }: Props) {
  const [isLiked, setIsLiked]   = useState(initialIsLiked);
  const [count, setCount]       = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  async function toggle() {
    if (isPending) return;
    const optimisticLiked = !isLiked;
    const optimisticCount = isLiked ? count - 1 : count + 1;

    setIsLiked(optimisticLiked);
    setCount(optimisticCount);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/activities/${activityId}/like`, {
          method: isLiked ? "DELETE" : "POST",
        });
        if (!res.ok) {
          // Revert on error
          setIsLiked(isLiked);
          setCount(count);
        }
      } catch {
        setIsLiked(isLiked);
        setCount(count);
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors",
        isLiked
          ? "text-red-400 bg-red-400/10 hover:bg-red-400/20"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      )}
    >
      <Heart className={cn("h-3.5 w-3.5", isLiked && "fill-current")} />
      <span>{count}</span>
    </button>
  );
}
