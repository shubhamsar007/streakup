import { prisma } from "@/lib/prisma";
import type { CreateTaskInput, UpdateTaskInput } from "@/server/validators/taskValidators";

export async function getTasksForDate(userId: string, date: string) {
  return prisma.dailyTask.findMany({
    where: {
      userId,
      taskDate: new Date(date),
    },
    orderBy: [
      { status: "asc" }, // PENDING first
      { createdAt: "asc" },
    ],
  });
}

export async function getTaskById(id: string, userId: string) {
  return prisma.dailyTask.findFirst({
    where: { id, userId },
  });
}

export async function createTask(userId: string, data: CreateTaskInput) {
  return prisma.dailyTask.create({
    data: {
      userId,
      title: data.title,
      description: data.description,
      taskDate: new Date(data.taskDate),
      priority: data.priority ?? null,
      status: "PENDING",
    },
  });
}

export async function updateTask(id: string, userId: string, data: UpdateTaskInput) {
  const task = await prisma.dailyTask.findFirst({ where: { id, userId } });
  if (!task) return null;

  return prisma.dailyTask.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.taskDate !== undefined && { taskDate: new Date(data.taskDate) }),
      ...(data.priority !== undefined && { priority: data.priority }),
    },
  });
}

export async function completeTask(id: string, userId: string) {
  const task = await prisma.dailyTask.findFirst({ where: { id, userId } });
  if (!task) return null;

  return prisma.dailyTask.update({
    where: { id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });
}

export async function undoCompleteTask(id: string, userId: string) {
  const task = await prisma.dailyTask.findFirst({ where: { id, userId } });
  if (!task) return null;

  return prisma.dailyTask.update({
    where: { id },
    data: {
      status: "PENDING",
      completedAt: null,
    },
  });
}

export async function deleteTask(id: string, userId: string) {
  const task = await prisma.dailyTask.findFirst({ where: { id, userId } });
  if (!task) return null;

  return prisma.dailyTask.delete({ where: { id } });
}

export async function getTaskStats(userId: string, date: string) {
  const tasks = await getTasksForDate(userId, date);
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  return { total, completed, pending: total - completed };
}
