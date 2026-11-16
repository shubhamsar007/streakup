"use client";

import { useState, useTransition } from "react";
import { UserPlus, UserMinus, UserCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type FollowStatus = "NONE" | "PENDING" | "ACCEPTED";

interface Props {
  userId: string;
  initialStatus: FollowStatus;
  className?: string;
}

export function FollowButton({ userId, initialStatus, className }: Props) {
  const [status, setStatus] = useState<FollowStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();

  async function handleClick() {
    if (isPending) return;

    if (status === "ACCEPTED" || status === "PENDING") {
      // Unfollow / cancel request
      const prev = status;
      setStatus("NONE");
      startTransition(async () => {
        try {
          const res = await fetch(`/api/v1/users/${userId}/follow`, { method: "DELETE" });
          if (!res.ok) setStatus(prev);
        } catch {
          setStatus(prev);
        }
      });
    } else {
      // Follow
      setStatus("PENDING");
      startTransition(async () => {
        try {
          const res = await fetch(`/api/v1/users/${userId}/follow`, { method: "POST" });
          if (res.ok) {
            const json = await res.json();
            setStatus(json.data?.status ?? "PENDING");
          } else {
            setStatus("NONE");
          }
        } catch {
          setStatus("NONE");
        }
      });
    }
  }

  const label =
    status === "ACCEPTED" ? "Following"
    : status === "PENDING" ? "Requested"
    : "Follow";

  const Icon =
    status === "ACCEPTED" ? UserCheck
    : status === "PENDING" ? Clock
    : UserPlus;

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        status === "ACCEPTED"
          ? "bg-secondary text-foreground hover:bg-destructive/10 hover:text-destructive"
          : status === "PENDING"
          ? "bg-secondary text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          : "bg-primary text-primary-foreground hover:bg-primary/90",
        isPending && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}
