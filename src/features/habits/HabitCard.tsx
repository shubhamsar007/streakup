"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Flame, Pause, Play, Archive, Edit, CheckCircle, Circle, Hash, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3">
      {/* Top Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/habits/${habit.id}`}
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate"
            >
              {habit.name}
            </Link>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                STATUS_STYLES[habit.status] ?? "bg-secondary text-muted-foreground"
              )}
            >
              {habit.status.toLowerCase()}
            </span>
          </div>
          {habit.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {habit.description}
            </p>
          )}
        </div>
      </div>

      {/* Meta Row */}
      <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
        <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 font-medium text-foreground">
          {habit.category}
        </span>
        <span className="inline-flex items-center gap-1">
          {getTrackingIcon(habit.trackingType)}
          {habit.trackingType === "CHECKBOX"
            ? "Checkbox"
            : habit.targetValue
            ? `${habit.targetValue} ${habit.unit ?? ""}`
            : habit.trackingType.toLowerCase()}
        </span>
        <span>{getFrequencyLabel(habit.scheduleVersions)}</span>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Flame className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium text-foreground">{habit.currentStreak}</span> day streak
        </span>
      </div>

      {/* Actions */}
      {habit.status !== "ARCHIVED" && (
        <div className="flex items-center gap-2 pt-1 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            asChild
            disabled={isLoading}
          >
            <Link href={`/habits/${habit.id}/edit`}>
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit
            </Link>
          </Button>
          {habit.status === "ACTIVE" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction("pause")}
              disabled={isLoading}
            >
              <Pause className="h-3.5 w-3.5 mr-1" />
              Pause
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction("resume")}
              disabled={isLoading}
            >
              <Play className="h-3.5 w-3.5 mr-1" />
              Resume
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAction("archive")}
            disabled={isLoading}
            className="text-destructive hover:text-destructive ml-auto"
          >
            <Archive className="h-3.5 w-3.5 mr-1" />
            Archive
          </Button>
        </div>
      )}
    </div>
  );
}
