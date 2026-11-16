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
          "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
          isCompleted
            ? "bg-success border-success text-white"
            : "border-border bg-transparent hover:border-success hover:text-success"
        )}
        aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className={cn("h-4 w-4", isCompleted ? "opacity-100" : "opacity-50")} />
        )}
      </button>
    );
  }

  // COUNT or DURATION
  if (isCompleted && completion) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-success font-medium">
          {completion.completedValue ?? "—"} {unit}
        </span>
        <button
          type="button"
          onClick={undoComplete}
          disabled={isLoading}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
        >
          Undo
        </button>
      </div>
    );
  }

  if (showInput) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          step="any"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={targetValue?.toString() ?? "0"}
          className="h-8 w-20 text-sm"
          disabled={isLoading}
        />
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
        <Button
          size="sm"
          onClick={() => markComplete(parseFloat(inputValue) || undefined)}
          disabled={isLoading || !inputValue}
        >
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Log"}
        </Button>
        <button
          type="button"
          onClick={() => setShowInput(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => setShowInput(true)}
      disabled={isLoading}
    >
      Log {trackingType === "DURATION" ? "time" : "count"}
    </Button>
  );
}
