"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Flame, Pause, Play, Archive, Edit, CheckCircle, Hash, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduleDay {
  weekday: number;
}

interface ScheduleVersion {
  frequencyType: "DAILY" | "SELECTED_DAYS";
  scheduleDays: ScheduleDay[];
}

export interface HabitCardData {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  trackingType: "CHECKBOX" | "COUNT" | "DURATION";
  targetValue: number | null;
  unit: string | null;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
  startDate: string | Date;
  currentStreak: number;
  scheduleVersions: ScheduleVersion[];
}

interface HabitCardProps {
  habit: HabitCardData;
  onStatusChange?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WEEKDAY_LABELS: Record<number, string> = {
  1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun",
};

function getFrequencyLabel(versions: ScheduleVersion[]): string {
  const active = versions[0];
  if (!active) return "No schedule";
  if (active.frequencyType === "DAILY") return "Every day";
  const days = active.scheduleDays
    .map((d) => WEEKDAY_LABELS[d.weekday])
    .filter(Boolean)
    .join(", ");
  return days || "No days selected";
}

function getTrackingIcon(type: "CHECKBOX" | "COUNT" | "DURATION") {
  if (type === "CHECKBOX") return <CheckCircle className="h-3.5 w-3.5" />;
  if (type === "COUNT") return <Hash className="h-3.5 w-3.5" />;
  return <Timer className="h-3.5 w-3.5" />;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-success/10 text-success",
  PAUSED: "bg-secondary text-muted-foreground",
  ARCHIVED: "bg-destructive/10 text-destructive",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function HabitCard({ habit, onStatusChange }: HabitCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleAction(endpoint: string) {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/habits/${habit.id}/${endpoint}`, {
        method: endpoint === "archive" ? "DELETE" : "POST",
      });
      if (res.ok) {
        onStatusChange?.();
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
      {/* Main content */}
      <Link href={`/habits/${habit.id}`} className="flex-1 p-4 block active:bg-secondary/50 transition-colors">
        {/* Top Row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[15px] font-semibold text-foreground leading-snug flex-1">
            {habit.name}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize shrink-0",
              STATUS_STYLES[habit.status] ?? "bg-secondary text-muted-foreground"
            )}
          >
            {habit.status.toLowerCase()}
          </span>
        </div>

        {habit.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {habit.description}
          </p>
        )}

        {/* Meta Row */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground">
            {habit.category}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            {getTrackingIcon(habit.trackingType)}
            {habit.trackingType === "CHECKBOX"
              ? "Checkbox"
              : habit.targetValue
              ? `${habit.targetValue} ${habit.unit ?? ""}`
              : habit.trackingType.toLowerCase()}
          </span>
          <span className="text-xs text-muted-foreground">{getFrequencyLabel(habit.scheduleVersions)}</span>
        </div>

        {/* Streak */}
        <div className="inline-flex items-center gap-1.5 text-sm">
          <Flame className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">{habit.currentStreak}</span>
          <span className="text-muted-foreground">day streak</span>
        </div>
      </Link>

      {/* Actions */}
      {habit.status !== "ARCHIVED" && (
        <div className="flex items-center border-t border-border">
          <Link
            href={`/habits/${habit.id}/edit`}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Link>
          <div className="w-px h-8 bg-border" />
          {habit.status === "ACTIVE" ? (
            <button
              onClick={() => handleAction("pause")}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
            >
              <Pause className="h-4 w-4" />
              Pause
            </button>
          ) : (
            <button
              onClick={() => handleAction("resume")}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              Resume
            </button>
          )}
          <div className="w-px h-8 bg-border" />
          <button
            onClick={() => handleAction("archive")}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            <Archive className="h-4 w-4" />
            Archive
          </button>
        </div>
      )}
    </div>
  );
}
