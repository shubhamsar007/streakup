import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import * as taskService from "@/server/services/taskService";
import { TasksView } from "@/features/tasks/TasksView";

export const metadata: Metadata = { title: "Daily Tasks" };

function getTodayString(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().split("T")[0]!;
  }
}

export default async function TasksPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const timezone = (session.user as { timezone?: string }).timezone ?? "UTC";
  const todayStr = getTodayString(timezone);

  const tasks = await taskService.getTasksForDate(session.user.id, todayStr);

  // Serialize dates for client component
  const serialized = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status as "PENDING" | "COMPLETED",
    priority: t.priority as "LOW" | "MEDIUM" | "HIGH" | null,
    taskDate: t.taskDate.toISOString().split("T")[0]!,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
  }));

  return <TasksView initialTasks={serialized} initialDate={todayStr} />;
}
