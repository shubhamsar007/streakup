"use client";

import { cn } from "@/lib/utils";

const WEEKDAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
];

interface WeekdaySelectorProps {
  selected: number[];
  onChange: (days: number[]) => void;
  disabled?: boolean;
}

export function WeekdaySelector({ selected, onChange, disabled }: WeekdaySelectorProps) {
  function toggle(value: number) {
    if (disabled) return;
    if (selected.includes(value)) {
      onChange(selected.filter((d) => d !== value));
    } else {
      onChange([...selected, value].sort((a, b) => a - b));
    }
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {WEEKDAYS.map((day) => {
        const isSelected = selected.includes(day.value);
        return (
          <button
            key={day.value}
            type="button"
            disabled={disabled}
            onClick={() => toggle(day.value)}
            className={cn(
              "h-9 w-11 rounded-md text-xs font-medium transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-foreground border-border hover:bg-secondary/80"
            )}
          >
            {day.label}
          </button>
        );
      })}
    </div>
  );
}
