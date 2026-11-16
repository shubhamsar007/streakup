import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Flame, Trophy, CheckCircle, TrendingUp, Calendar, Award, Activity } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOverviewStats, getWeeklyStats, getMonthlyStats, getHabitStats } from "@/server/services/statisticsService";
import { WeeklyChart } from "@/features/statistics/WeeklyChart";
import { MonthlyChart } from "@/features/statistics/MonthlyChart";
import { HabitStatsTable } from "@/features/statistics/HabitStatsTable";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Statistics" };

export default async function StatisticsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const userRow = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  });
  const timezone = userRow?.timezone ?? "UTC";

  const [overview, weeklyStats, monthlyStats, habitStats] = await Promise.all([
    getOverviewStats(session.user.id, timezone),
    getWeeklyStats(session.user.id, timezone),
    getMonthlyStats(session.user.id, timezone),
    getHabitStats(session.user.id, timezone),
  ]);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Statistics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your personal habit analytics and performance overview.
        </p>
      </div>

      {/* Overview Cards — row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Current Streak</span>
              <Flame className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{overview.currentStreak}</div>
            <div className="text-xs text-muted-foreground">days</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Best Streak</span>
              <Trophy className="h-4 w-4 text-warning" />
            </div>
            <div className="text-2xl font-bold text-foreground">{overview.longestStreak}</div>
            <div className="text-xs text-muted-foreground">days</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Total Completions</span>
              <CheckCircle className="h-4 w-4 text-success" />
            </div>
            <div className="text-2xl font-bold text-foreground">{overview.totalCompletions}</div>
            <div className="text-xs text-muted-foreground">all time</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Active Habits</span>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{overview.activeHabits}</div>
            <div className="text-xs text-muted-foreground">habits</div>
          </CardContent>
        </Card>
      </div>

      {/* Overview Cards — row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">This Week</span>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className={`text-2xl font-bold ${
              overview.weeklyRate >= 80 ? "text-success" :
              overview.weeklyRate >= 50 ? "text-primary" :
              "text-foreground"
            }`}>
              {overview.weeklyRate > 0 ? `${overview.weeklyRate}%` : "—"}
            </div>
            <div className="text-xs text-muted-foreground">completion rate</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">This Month</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className={`text-2xl font-bold ${
              overview.monthlyRate >= 80 ? "text-success" :
              overview.monthlyRate >= 50 ? "text-primary" :
              "text-foreground"
            }`}>
              {overview.monthlyRate > 0 ? `${overview.monthlyRate}%` : "—"}
            </div>
            <div className="text-xs text-muted-foreground">completion rate</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Most Consistent</span>
              <Award className="h-4 w-4 text-warning" />
            </div>
            {overview.mostConsistentHabit ? (
              <>
                <Link
                  href={`/habits/${overview.mostConsistentHabit.id}`}
                  className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                >
                  {overview.mostConsistentHabit.name}
                </Link>
                <div className="text-xs text-muted-foreground">
                  {overview.mostConsistentHabit.completionRate}% completion
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Weekly Completion Rate</CardTitle>
            <p className="text-xs text-muted-foreground">Last 8 weeks</p>
          </CardHeader>
          <CardContent>
            <WeeklyChart data={weeklyStats} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Monthly Overview</CardTitle>
            <p className="text-xs text-muted-foreground">Scheduled vs completed habit-days</p>
          </CardHeader>
          <CardContent>
            <MonthlyChart data={monthlyStats} />
          </CardContent>
        </Card>
      </div>

      {/* Habit Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Habit Breakdown</CardTitle>
          <p className="text-xs text-muted-foreground">Click column headers to sort</p>
        </CardHeader>
        <CardContent className="p-0">
          <HabitStatsTable habits={habitStats} />
        </CardContent>
      </Card>
    </div>
  );
}
