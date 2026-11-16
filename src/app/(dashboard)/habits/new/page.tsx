"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HabitForm, type HabitFormValues } from "@/features/habits/HabitForm";

export default function NewHabitPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: HabitFormValues) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json() as { success: boolean; error?: { message: string } };
      if (!res.ok) {
        setError(json.error?.message ?? "Something went wrong");
        return;
      }
      router.push("/habits");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/habits"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Habits
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Add New Habit</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define a new habit to track and build your streaks.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="bg-card border border-border rounded-lg p-6">
        <HabitForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitLabel="Create Habit"
        />
      </div>
    </div>
  );
}
