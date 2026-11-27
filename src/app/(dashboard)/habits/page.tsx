import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { HabitCard } from "@/features/habits/HabitCard";
import * as habitService from "@/server/services/habitService";
import { getAllHabitStreaks } from "@/server/services/streakService";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";

export const metadata: Metadata = { title: "My Habits" };

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function HabitsPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { status } = await searchParams;
  const userRow = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  });
  const userTimezone = userRow?.timezone ?? "UTC";

  const [habits, habitStreaks] = await Promise.all([
    habitService.getHabitsList(session.user.id, status),
    getAllHabitStreaks(session.user.id, userTimezone),
  ]);
  const streakMap = new Map(habitStreaks.map((s) => [s.habitId, s.current]));

  return (
    <div className="px-4 py-5 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">My Habits</h1>
        {/* Desktop add button — hidden on mobile (FAB handles it) */}
        <Button asChild className="hidden sm:flex h-10 px-4 rounded-xl">
          <Link href="/habits/new">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Habit
          </Link>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-0.5 mb-5 border-b border-border">
        {STATUS_TABS.map((tab) => {
          const isActive = (status ?? "") === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value ? `/habits?status=${tab.value}` : "/habits"}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Habit List */}
      {habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-base font-medium text-foreground mb-1">No habits yet</p>
          <p className="text-sm text-muted-foreground mb-5">
            Start building your first habit today.
          </p>
          <Button asChild className="h-11 px-5 rounded-xl">
            <Link href="/habits/new">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Your First Habit
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={{
                id: habit.id,
                name: habit.name,
                description: habit.description,
                category: habit.category,
                icon: habit.icon,
                trackingType: habit.trackingType,
                targetValue: habit.targetValue ? Number(habit.targetValue) : null,
                unit: habit.unit,
                status: habit.status,
                startDate: habit.startDate,
                currentStreak: streakMap.get(habit.id) ?? 0,
                scheduleVersions: habit.scheduleVersions.map((sv) => ({
                  frequencyType: sv.frequencyType,
                  scheduleDays: sv.scheduleDays,
                })),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
