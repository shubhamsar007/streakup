import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Flame, CheckCircle, Calendar, Trophy } from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as habitRepo from "@/server/repositories/habitRepository";
import { HabitCompletionButton } from "@/features/habits/HabitCompletionButton";
import { getHabitStreak } from "@/server/services/streakService";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Habit Detail" };

interface PageProps {
  params: Promise<{ habitId: string }>;
}

function getTodayString(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().split("T")[0]!;
  }
}

function getLast30Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    d.setUTCHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}

export default async function HabitDetailPage({ params }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { habitId } = await params;

  const [habit, userRow] = await Promise.all([
    habitRepo.findById(habitId),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { timezone: true },
    }),
  ]);

  if (!habit) notFound();
  if (habit.userId !== session.user.id) notFound();

  const userTimezone = userRow?.timezone ?? "UTC";
  const today = getTodayString(userTimezone);
  const streakData = await getHabitStreak(habitId, session.user.id, userTimezone);
  const last30Days = getLast30Days();
  const completionSet = new Set(
    habit.completions.map((c) => new Date(c.localDate).toISOString().split("T")[0])
  );

  const totalCompletions = habit.completions.length;
  const todayCompletion = habit.completions.find(
    (c) => new Date(c.localDate).toISOString().split("T")[0] === today
  );

  return (
    <div className="px-4 py-5 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/habits"
        className="inline-flex items-center gap-1.5 min-h-[44px] text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Habits
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">{habit.name}</h1>
          {habit.description && (
            <p className="mt-1 text-sm text-muted-foreground">{habit.description}</p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground">
              {habit.category}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                habit.status === "ACTIVE"
                  ? "bg-success/10 text-success"
                  : habit.status === "PAUSED"
                  ? "bg-secondary text-muted-foreground"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {habit.status.toLowerCase()}
            </span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" asChild className="h-10 px-4 rounded-xl">
            <Link href={`/habits/${habitId}/edit`}>Edit</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Current Streak</div>
            <div className="flex items-center gap-1 text-xl font-bold text-foreground">
              <Flame className="h-5 w-5 text-primary" />
              {streakData?.current ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Best Streak</div>
            <div className="flex items-center gap-1 text-xl font-bold text-foreground">
              <Trophy className="h-5 w-5 text-warning" />
              {streakData?.longest ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Completions</div>
            <div className="flex items-center gap-1 text-xl font-bold text-foreground">
              <CheckCircle className="h-5 w-5 text-success" />
              {streakData?.totalCompleted ?? totalCompletions}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Completion Rate</div>
            <div className="flex items-center gap-1 text-xl font-bold text-success">
              {streakData && streakData.eligibleDays > 0
                ? `${Math.round((streakData.totalCompleted / streakData.eligibleDays) * 100)}%`
                : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Completion */}
      {habit.status === "ACTIVE" && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="text-[15px] text-foreground font-medium flex-1">{habit.name}</span>
              <HabitCompletionButton
                habitId={habit.id}
                trackingType={habit.trackingType}
                targetValue={habit.targetValue ? Number(habit.targetValue) : null}
                unit={habit.unit}
                localDate={today}
                isCompleted={!!todayCompletion}
                completion={
                  todayCompletion
                    ? {
                        id: todayCompletion.id,
                        completedValue: todayCompletion.completedValue
                          ? Number(todayCompletion.completedValue)
                          : null,
                      }
                    : null
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last 30 Days Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-1.5">
            {last30Days.map((day) => {
              const dateStr = day.toISOString().split("T")[0]!;
              const isComplete = completionSet.has(dateStr);
              const isToday = dateStr === today;
              return (
                <div
                  key={dateStr}
                  title={dateStr}
                  className={`aspect-square rounded-sm transition-colors ${
                    isComplete
                      ? "bg-success"
                      : isToday
                      ? "bg-secondary border-2 border-primary/50"
                      : "bg-secondary"
                  }`}
                />
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-sm bg-success inline-block" />
              Completed
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-sm bg-secondary inline-block border border-border" />
              Missed / Not scheduled
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
