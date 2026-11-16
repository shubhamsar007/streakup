"use client";

import { useState } from "react";
import { Check, Pencil, Trash2, RotateCcw, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Priority = "LOW" | "MEDIUM" | "HIGH" | null;

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: "PENDING" | "COMPLETED";
  priority?: Priority;
  completedAt?: Date | string | null;
}

interface DailyTaskCardProps {
  task: Task;
  onComplete: (id: string) => Promise<void>;
  onUndo: (id: string) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
}

const PRIORITY_STYLES: Record<NonNullable<Priority>, string> = {
  HIGH: "text-destructive bg-destructive/10 border-destructive/20",
  MEDIUM: "text-warning bg-warning/10 border-warning/20",
  LOW: "text-muted-foreground bg-secondary border-border",
};

export function DailyTaskCard({
  task,
  onComplete,
  onUndo,
  onEdit,
  onDelete,
}: DailyTaskCardProps) {
  const [loading, setLoading] = useState(false);
  const isDone = task.status === "COMPLETED";

  async function handleToggle() {
    setLoading(true);
    try {
      if (isDone) await onUndo(task.id);
      else await onComplete(task.id);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await onDelete(task.id);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 transition-colors",
        isDone ? "border-border/50 bg-secondary/30 opacity-70" : "border-border bg-card"
      )}
    >
      {/* Completion toggle */}
      <button
        onClick={handleToggle}
        disabled={loading}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
          isDone
            ? "border-success bg-success text-white"
            : "border-border hover:border-primary"
        )}
      >
        {isDone && <Check className="h-3 w-3" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "text-sm font-medium",
              isDone ? "line-through text-muted-foreground" : "text-foreground"
            )}
          >
            {task.title}
          </span>
          {task.priority && (
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                PRIORITY_STYLES[task.priority]
              )}
            >
              {task.priority}
            </span>
          )}
        </div>
        {task.description && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {!isDone && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(task)}
            disabled={loading}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        {isDone && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleToggle}
            disabled={loading}
            title="Mark as pending"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:text-destructive"
          onClick={handleDelete}
          disabled={loading}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
