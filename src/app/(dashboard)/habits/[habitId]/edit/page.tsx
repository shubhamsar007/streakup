"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HabitForm, type HabitFormValues } from "@/features/habits/HabitForm";

interface HabitData {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  trackingType: "CHECKBOX" | "COUNT" | "DURATION";
  targetValue: number | null;
  unit: string | null;
  visibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
  startDate: string;
  scheduleVersions: Array<{
    frequencyType: "DAILY" | "SELECTED_DAYS";
    scheduleDays: Array<{ weekday: number }>;
  }>;
}

export default function EditHabitPage() {
  const router = useRouter();
  const params = useParams<{ habitId: string }>();
  const habitId = params.habitId;

  const [habit, setHabit] = useState<HabitData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHabit() {
      try {
        const res = await fetch(`/api/v1/habits/${habitId}`);
        const json = await res.json() as { success: boolean; data?: HabitData; error?: { message: string } };
        if (!res.ok) {
          setError(json.error?.message ?? "Habit not found");
          return;
        }
        setHabit(json.data!);
      } catch {
        setError("Failed to load habit.");
      } finally {
        setIsFetching(false);
      }
    }
    fetchHabit();
  }, [habitId]);

  async function handleSubmit(data: HabitFormValues) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/habits/${habitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json() as { success: boolean; error?: { message: string } };
      if (!res.ok) {
        setError(json.error?.message ?? "Something went wrong");
        return;
      }
      router.push(`/habits/${habitId}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const activeVersion = habit?.scheduleVersions[0];
  const defaultValues: Partial<HabitFormValues> | undefined = habit
    ? {
        name: habit.name,
        description: habit.description ?? undefined,
        category: habit.category,
        icon: habit.icon ?? undefined,
        trackingType: habit.trackingType,
        targetValue: habit.targetValue ?? undefined,
        unit: habit.unit ?? undefined,
        visibility: habit.visibility,
        frequencyType: activeVersion?.frequencyType ?? "DAILY",
        selectedDays: activeVersion?.scheduleDays.map((d) => d.weekday) ?? [],
        startDate: new Date(habit.startDate).toISOString().split("T")[0]!,
      }
    : undefined;

  return (
    <div className="px-4 py-5 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      <div className="mb-5">
        <Link
          href={`/habits/${habitId}`}
          className="inline-flex items-center gap-1.5 min-h-[44px] text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Edit Habit</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your habit details. Schedule changes take effect from today.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {isFetching ? (
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 bg-secondary animate-pulse rounded-md" />
          ))}
        </div>
      ) : habit && defaultValues ? (
        <div className="bg-card border border-border rounded-lg p-6">
          <HabitForm
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            submitLabel="Update Habit"
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Habit not found.</p>
      )}
    </div>
  );
}
