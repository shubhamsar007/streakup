"use client";

import { useState, useCallback } from "react";
import { Plus, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DailyTaskCard } from "./DailyTaskCard";
import { TaskForm } from "./TaskForm";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: "PENDING" | "COMPLETED";
  priority?: "LOW" | "MEDIUM" | "HIGH" | null;
  taskDate: string | Date;
  completedAt?: Date | string | null;
}

interface TasksViewProps {
  initialTasks: Task[];
  initialDate: string;
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const todayStr = today.toISOString().split("T")[0]!;
  const yesterdayStr = yesterday.toISOString().split("T")[0]!;
  const tomorrowStr = tomorrow.toISOString().split("T")[0]!;

  if (dateStr === todayStr) return "Today";
  if (dateStr === yesterdayStr) return "Yesterday";
  if (dateStr === tomorrowStr) return "Tomorrow";

  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0]!;
}

export function TasksView({ initialTasks, initialDate }: TasksViewProps) {
  const [date, setDate] = useState(initialDate);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/daily-tasks?date=${d}`);
      const json = await res.json();
      if (json.success) setTasks(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  function navigateDate(direction: -1 | 1) {
    const newDate = offsetDate(date, direction);
    setDate(newDate);
    setShowForm(false);
    setEditingTask(null);
    fetchTasks(newDate);
  }

  async function handleCreate(data: {
    title: string;
    description?: string;
    taskDate: string;
    priority?: "LOW" | "MEDIUM" | "HIGH";
  }) {
    const res = await fetch("/api/v1/daily-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.success) {
      setShowForm(false);
      // If task date matches current view, add it; otherwise navigate
      if (data.taskDate === date) {
        setTasks((prev) => [...prev, json.data]);
      } else {
        setDate(data.taskDate);
        await fetchTasks(data.taskDate);
      }
    }
  }

  async function handleUpdate(data: {
    title: string;
    description?: string;
    taskDate: string;
    priority?: "LOW" | "MEDIUM" | "HIGH";
  }) {
    if (!editingTask) return;
    const res = await fetch(`/api/v1/daily-tasks/${editingTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.success) {
      setEditingTask(null);
      await fetchTasks(date);
    }
  }

  async function handleComplete(id: string) {
    const res = await fetch(`/api/v1/daily-tasks/${id}/complete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ undo: false }),
    });
    const json = await res.json();
    if (json.success) {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "COMPLETED" as const, completedAt: new Date() } : t))
      );
    }
  }

  async function handleUndo(id: string) {
    const res = await fetch(`/api/v1/daily-tasks/${id}/complete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ undo: true }),
    });
    const json = await res.json();
    if (json.success) {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "PENDING" as const, completedAt: null } : t))
      );
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/v1/daily-tasks/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  }

  const pending = tasks.filter((t) => t.status === "PENDING");
  const completed = tasks.filter((t) => t.status === "COMPLETED");
  const total = tasks.length;
  const completedCount = completed.length;
  const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const isToday = date === initialDate;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Daily Tasks</h1>
        <Button
          size="sm"
          onClick={() => {
            setShowForm(true);
            setEditingTask(null);
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Task
        </Button>
      </div>

      {/* Date navigator */}
      <div className="flex items-center justify-between mb-6 rounded-xl border border-border bg-card px-4 py-3">
        <button
          onClick={() => navigateDate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="text-center">
          <div className={cn("font-semibold", isToday ? "text-primary" : "text-foreground")}>
            {formatDisplayDate(date)}
          </div>
          <div className="text-xs text-muted-foreground">{date}</div>
        </div>

        <button
          onClick={() => navigateDate(1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-secondary transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Progress */}
      {total > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedCount} / {total} tasks
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          {progress === 100 && (
            <p className="mt-2 text-xs text-success font-medium">All done! Great work.</p>
          )}
        </div>
      )}

      {/* Add / Edit form */}
      {(showForm || editingTask) && (
        <div className="mb-6 rounded-xl border border-primary/30 bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            {editingTask ? "Edit Task" : "New Task"}
          </h3>
          <TaskForm
            defaultDate={date}
            initialValues={
              editingTask
                ? {
                    title: editingTask.title,
                    description: editingTask.description,
                    taskDate: typeof editingTask.taskDate === "string"
                      ? editingTask.taskDate.split("T")[0]
                      : new Date(editingTask.taskDate).toISOString().split("T")[0],
                    priority: editingTask.priority,
                  }
                : undefined
            }
            onSubmit={editingTask ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditingTask(null);
            }}
            submitLabel={editingTask ? "Save Changes" : "Add Task"}
          />
        </div>
      )}

      {/* Empty state */}
      {tasks.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <ClipboardList className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No tasks for {formatDisplayDate(date).toLowerCase()}</p>
          <p className="mt-1 text-xs text-muted-foreground mb-4">
            Add a one-off task to stay on top of your day.
          </p>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add a Task
          </Button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-secondary/50 animate-pulse" />
          ))}
        </div>
      )}

      {/* Pending tasks */}
      {!loading && pending.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Pending ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.map((task) => (
              <DailyTaskCard
                key={task.id}
                task={task}
                onComplete={handleComplete}
                onUndo={handleUndo}
                onEdit={(t) => {
                  setEditingTask(t as Task);
                  setShowForm(false);
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed tasks */}
      {!loading && completed.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Completed ({completed.length})
          </h3>
          <div className="space-y-2">
            {completed.map((task) => (
              <DailyTaskCard
                key={task.id}
                task={task}
                onComplete={handleComplete}
                onUndo={handleUndo}
                onEdit={(t) => {
                  setEditingTask(t as Task);
                  setShowForm(false);
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
