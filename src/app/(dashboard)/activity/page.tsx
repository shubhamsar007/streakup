import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCalendarData, getUserHabitsForFilter, getCurrentYear } from "@/server/services/calendarService";

import { getTodayUTC, formatLocalDate } from "@/lib/dateUtils";
import { ActivityCalendarView } from "@/features/activity/ActivityCalendarView";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Activity Calendar" };

interface PageProps {
  searchParams: Promise<{ year?: string; habitId?: string }>;
}

export default async function ActivityPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { year: yearParam, habitId } = await searchParams;

  const userRow = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  });
  const timezone = userRow?.timezone ?? "UTC";
  const currentYear = getCurrentYear(timezone);
  const year = yearParam ? Math.min(currentYear, Math.max(2020, parseInt(yearParam, 10))) : currentYear;

  const [calendarData, habits] = await Promise.all([
    getCalendarData(session.user.id, year, timezone, habitId),
    getUserHabitsForFilter(session.user.id),
  ]);

  const today = formatLocalDate(getTodayUTC(timezone));

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Activity Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your habit completion history at a glance.
        </p>
      </div>

      <ActivityCalendarView
        calendarData={calendarData}
        habits={habits}
        year={year}
        currentYear={currentYear}
        today={today}
        selectedHabitId={habitId}
      />
    </div>
  );
}
