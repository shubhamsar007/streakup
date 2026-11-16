"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  taskDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", ""]).optional(),
});

type FormData = z.infer<typeof schema>;

interface TaskFormProps {
  defaultDate: string;
  initialValues?: {
    title?: string;
    description?: string | null;
    taskDate?: string;
    priority?: string | null;
  };
  onSubmit: (data: {
    title: string;
    description?: string;
    taskDate: string;
    priority?: "LOW" | "MEDIUM" | "HIGH";
  }) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function TaskForm({
  defaultDate,
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Add Task",
}: TaskFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialValues?.title ?? "",
      description: initialValues?.description ?? "",
      taskDate: initialValues?.taskDate ?? defaultDate,
      priority: (initialValues?.priority as FormData["priority"]) ?? "",
    },
  });

  useEffect(() => {
    if (initialValues) {
      reset({
        title: initialValues.title ?? "",
        description: initialValues.description ?? "",
        taskDate: initialValues.taskDate ?? defaultDate,
        priority: (initialValues.priority as FormData["priority"]) ?? "",
      });
    }
  }, [initialValues, defaultDate, reset]);

  async function handleFormSubmit(data: FormData) {
    await onSubmit({
      title: data.title,
      description: data.description || undefined,
      taskDate: data.taskDate,
      priority: data.priority ? (data.priority as "LOW" | "MEDIUM" | "HIGH") : undefined,
    });
    reset();
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="task-title">Title</Label>
        <Input
          id="task-title"
          placeholder="What needs to be done?"
          autoFocus
          {...register("title")}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="task-desc">
          Description <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="task-desc"
          placeholder="Add details..."
          rows={2}
          {...register("description")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="task-date">Date</Label>
          <Input id="task-date" type="date" {...register("taskDate")} />
          {errors.taskDate && (
            <p className="text-xs text-destructive">{errors.taskDate.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="task-priority">Priority</Label>
          <select
            id="task-priority"
            className="flex h-9 w-full rounded-md border border-border bg-secondary px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register("priority")}
          >
            <option value="">None</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
