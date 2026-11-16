"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { DateDetailPanel } from "./DateDetailPanel";
import type { CalendarData } from "@/lib/calendarUtils";

interface Habit { id: string; name: string }

interface Props {
  calendarData: CalendarData;
  habits: Habit[];
  year: number;
  currentYear: number;
  today: string;
  selectedHabitId?: string;
}

export function ActivityCalendarView({
  calendarData,
  habits,
  year,
  currentYear,
  today,
  selectedHabitId,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  function navigate(newYear: number, habitId?: string) {
    const params = new URLSearchParams();
    if (newYear !== currentYear) params.set("year", String(newYear));
    if (habitId) params.set("habitId", habitId);
    const qs = params.toString();
    startTransition(() => {
      router.push(`/activity${qs ? "?" + qs : ""}`);
    });
  }

  return (
    <>
      {/* Controls */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        {/* Year navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(year - 1, selectedHabitId)}
            disabled={year <= 2020}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-foreground w-12 text-center">{year}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(year + 1, selectedHabitId)}
            disabled={year >= currentYear}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Habit filter */}
        <select
          value={selectedHabitId ?? ""}
          onChange={(e) => navigate(year, e.target.value || undefined)}
          className="text-sm bg-card border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All habits</option>
          {habits.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {year} Activity
            {selectedHabitId && habits.find((h) => h.id === selectedHabitId)
              ? ` — ${habits.find((h) => h.id === selectedHabitId)!.name}`
              : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap
            calendarData={calendarData}
            year={year}
            today={today}
            selectedDate={selectedDate ?? undefined}
            onDateSelect={(d) => setSelectedDate((prev) => (prev === d ? null : d))}
          />
        </CardContent>
      </Card>

      {/* Date detail */}
      <DateDetailPanel
        date={selectedDate}
        onClose={() => setSelectedDate(null)}
      />
    </>
  );
}
