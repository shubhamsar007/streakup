"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CompletionData {
  id: string;
  completedValue: number | null;
}

interface HabitCompletionButtonProps {
  habitId: string;
  trackingType: "CHECKBOX" | "COUNT" | "DURATION";
  targetValue: number | null;
  unit: string | null;
  localDate: string;
  isCompleted: boolean;
  completion: CompletionData | null;
  onCompletionChange?: (isCompleted: boolean) => void;
}

export function HabitCompletionButton({
  habitId,
  trackingType,
  targetValue,
  unit,
  localDate,
  isCompleted: initialIsCompleted,
  completion: initialCompletion,
  onCompletionChange,
}: HabitCompletionButtonProps) {
  const [isCompleted, setIsCompleted] = useState(initialIsCompleted);
  const [completion, setCompletion] = useState<CompletionData | null>(initialCompletion);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState(
    initialCompletion?.completedValue?.toString() ?? ""
  );
  const [showInput, setShowInput] = useState(false);

  async function markComplete(value?: number) {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/habits/${habitId}/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localDate, completedValue: value }),
      });
      if (res.ok) {
        const json = await res.json() as { data: CompletionData };
        setIsCompleted(true);
        setCompletion(json.data);
        setShowInput(false);
        onCompletionChange?.(true);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function undoComplete() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/habits/${habitId}/completions/${localDate}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setIsCompleted(false);
        setCompletion(null);
        setInputValue("");
        onCompletionChange?.(false);
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (trackingType === "CHECKBOX") {
    return (
      <button
        type="button"
        onClick={isCompleted ? undoComplete : () => markComplete()}
        disabled={isLoading}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 shrink-0",
          isCompleted
            ? "bg-success border-success text-white"
            : "border-border bg-transparent hover:border-success hover:text-success"
        )}
        aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Check className={cn("h-5 w-5", isCompleted ? "opacity-100" : "opacity-40")} />
        )}
      </button>
    );
  }

  // COUNT or DURATION
  if (isCompleted && completion) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm text-success font-medium">
          {completion.completedValue ?? "—"} {unit}
        </span>
        <button
          type="button"
          onClick={undoComplete}
          disabled={isLoading}
          className="min-h-[36px] px-2 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
        >
          Undo
        </button>
      </div>
    );
  }

  if (showInput) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <Input
          type="number"
          min={0}
          step="any"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={targetValue?.toString() ?? "0"}
          className="h-10 w-20 text-sm"
          disabled={isLoading}
        />
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
        <Button
          onClick={() => markComplete(parseFloat(inputValue) || undefined)}
          disabled={isLoading || !inputValue}
          className="h-10 px-3"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log"}
        </Button>
        <button
          type="button"
          onClick={() => setShowInput(false)}
          className="min-h-[36px] px-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={() => setShowInput(true)}
      disabled={isLoading}
      className="h-10 px-4 rounded-xl shrink-0"
    >
      Log {trackingType === "DURATION" ? "time" : "count"}
    </Button>
  );
}
