import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Flame, Plus, ClipboardList, Check } from "lucide-react";
import { auth } from "@/lib/auth";
import { getGreeting } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HabitCompletionButton } from "@/features/habits/HabitCompletionButton";
import * as habitService from "@/server/services/habitService";
import * as taskService from "@/server/services/taskService";
import { getOverallStreak } from "@/server/services/streakService";
import { prisma } from "@/lib/prisma";

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

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const timezone = (session.user as { timezone?: string }).timezone ?? "UTC";
  const todayStr = getTodayString(timezone);
  const userTimezone = (await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  }))?.timezone ?? "UTC";

  const [todayHabits, todayTasks, overallStreak] = await Promise.all([
    habitService.getHabitsForDate(session.user.id, todayStr),
    taskService.getTasksForDate(session.user.id, todayStr),
    getOverallStreak(session.user.id, userTimezone),
  ]);

  const completedCount = todayHabits.filter((h) => h.isCompleted).length;
  const totalCount = todayHabits.length;
  const completedTasks = todayTasks.filter((t) => t.status === "COMPLETED").length;

  const greeting = getGreeting();
  const displayName = session.user.name?.split(" ")[0] || "there";

  return (
    <div className="px-4 py-5 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          {greeting}, {displayName}!
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1.5">Current Streak</div>
            <div className="flex items-center gap-1.5 text-2xl font-bold text-foreground">
              <Flame className="h-5 w-5 text-primary shrink-0" />
              {overallStreak.current}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {overallStreak.current === 1 ? "day" : "days"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1.5">Today&apos;s Progress</div>
            <div className="text-2xl font-bold text-foreground">
              {completedCount}<span className="text-muted-foreground text-lg">/{totalCount}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">habits done</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1.5">Completion Rate</div>
            <div className="text-2xl font-bold text-success">
              {totalCount > 0
                ? `${Math.round((completedCount / totalCount) * 100)}%`
                : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">today</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1.5">Best Streak</div>
            <div className="text-2xl font-bold text-foreground">
              {overallStreak.longest}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {overallStreak.longest === 1 ? "day" : "days"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Habits */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Today&apos;s Habits</CardTitle>
            {totalCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {completedCount}/{totalCount} done
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {todayHabits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                <Flame className="h-7 w-7 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">No habits scheduled today</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Start building your first habit to see it here.
              </p>
              <Link
                href="/habits/new"
                className="mt-4 inline-flex items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Add Your First Habit
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {todayHabits.map((habit) => (
                <div key={habit.id} className="flex items-center justify-between gap-3 px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/habits/${habit.id}`}
                      className="text-[15px] font-medium text-foreground hover:text-primary transition-colors block truncate"
                    >
                      {habit.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">{habit.category}</p>
                  </div>
                  <HabitCompletionButton
                    habitId={habit.id}
                    trackingType={habit.trackingType}
                    targetValue={habit.targetValue ? Number(habit.targetValue) : null}
                    unit={habit.unit}
                    localDate={todayStr}
                    isCompleted={habit.isCompleted}
                    completion={
                      habit.completion
                        ? {
                            id: habit.completion.id,
                            completedValue: habit.completion.completedValue
                              ? Number(habit.completion.completedValue)
                              : null,
                          }
                        : null
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Tasks */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Today&apos;s Tasks</CardTitle>
            <div className="flex items-center gap-3">
              {todayTasks.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {completedTasks}/{todayTasks.length} done
                </span>
              )}
              <Link
                href="/tasks"
                className="text-xs font-medium text-primary hover:underline"
              >
                View all →
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {todayTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <ClipboardList className="h-9 w-9 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No tasks for today</p>
              <Link
                href="/tasks"
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add a task
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {todayTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-6 py-4"
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      task.status === "COMPLETED"
                        ? "border-success bg-success"
                        : "border-border"
                    }`}
                  >
                    {task.status === "COMPLETED" && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span
                    className={`flex-1 text-[15px] ${
                      task.status === "COMPLETED"
                        ? "line-through text-muted-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {task.title}
                  </span>
                  {task.priority && task.priority !== null && (
                    <span className="text-xs text-muted-foreground">{task.priority}</span>
                  )}
                </div>
              ))}
              {todayTasks.length > 5 && (
                <Link
                  href="/tasks"
                  className="block text-center text-sm text-muted-foreground hover:text-primary py-3"
                >
                  +{todayTasks.length - 5} more tasks
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
