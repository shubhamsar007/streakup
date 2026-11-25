"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { WeekdaySelector } from "@/components/shared/WeekdaySelector";
import { cn } from "@/lib/utils";

// ─── Schema ───────────────────────────────────────────────────────────────────

const formSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    description: z.string().max(500).optional(),
    category: z.string().min(1, "Category is required"),
    icon: z.string().optional(),
    trackingType: z.enum(["CHECKBOX", "COUNT", "DURATION"]),
    targetValue: z.number().positive("Must be a positive number").optional(),
    unit: z.string().optional(),
    visibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]),
    frequencyType: z.enum(["DAILY", "SELECTED_DAYS"]),
    selectedDays: z.array(z.number().int().min(1).max(7)).optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .superRefine((data, ctx) => {
    if (
      (data.trackingType === "COUNT" || data.trackingType === "DURATION") &&
      data.targetValue === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Target value is required for Count and Duration tracking",
        path: ["targetValue"],
      });
    }
    if (
      data.frequencyType === "SELECTED_DAYS" &&
      (!data.selectedDays || data.selectedDays.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select at least one day",
        path: ["selectedDays"],
      });
    }
  });

export type HabitFormValues = z.infer<typeof formSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Health & Fitness",
  "Learning",
  "Mindfulness",
  "Productivity",
  "Creativity",
  "Social",
  "Finance",
  "Other",
];

// ─── Component ────────────────────────────────────────────────────────────────

interface HabitFormProps {
  defaultValues?: Partial<HabitFormValues>;
  onSubmit: (data: HabitFormValues) => void | Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function HabitForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel = "Save Habit",
}: HabitFormProps) {
  const today = new Date().toISOString().split("T")[0]!;

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<HabitFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      trackingType: "CHECKBOX",
      frequencyType: "DAILY",
      visibility: "PUBLIC",
      startDate: today,
      selectedDays: [],
      ...defaultValues,
    },
  });

  const trackingType = watch("trackingType");
  const frequencyType = watch("frequencyType");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Habit Name <span className="text-destructive">*</span>
        </label>
        <Input
          {...register("name")}
          placeholder="e.g. Morning Run"
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Description</label>
        <Textarea
          {...register("description")}
          placeholder="Optional description..."
          disabled={isLoading}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Category <span className="text-destructive">*</span>
        </label>
        <select
          {...register("category")}
          disabled={isLoading}
          className="flex h-9 w-full rounded-md border border-border bg-secondary px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer"
        >
          <option value="">Select a category</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-xs text-destructive">{errors.category.message}</p>
        )}
      </div>

      {/* Tracking Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Tracking Type</label>
        <div className="flex gap-3">
          {(["CHECKBOX", "COUNT", "DURATION"] as const).map((type) => (
            <label
              key={type}
              className={cn(
                "flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-md border text-sm font-medium transition-colors",
                trackingType === type
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-foreground border-border hover:bg-secondary/80"
              )}
            >
              <input
                type="radio"
                value={type}
                {...register("trackingType")}
                className="sr-only"
                disabled={isLoading}
              />
              {type === "CHECKBOX" ? "Checkbox" : type === "COUNT" ? "Count" : "Duration"}
            </label>
          ))}
        </div>
      </div>

      {/* Target Value + Unit (only for COUNT/DURATION) */}
      {(trackingType === "COUNT" || trackingType === "DURATION") && (
        <div className="flex gap-3">
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Target Value <span className="text-destructive">*</span>
            </label>
            <Input
              type="number"
              min={0}
              step="any"
              {...register("targetValue", { valueAsNumber: true })}
              placeholder={trackingType === "DURATION" ? "e.g. 30" : "e.g. 10"}
              disabled={isLoading}
            />
            {errors.targetValue && (
              <p className="text-xs text-destructive">{errors.targetValue.message}</p>
            )}
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium text-foreground">Unit</label>
            <Input
              {...register("unit")}
              placeholder={trackingType === "DURATION" ? "minutes" : "reps"}
              disabled={isLoading}
            />
          </div>
        </div>
      )}

      {/* Frequency */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Frequency</label>
        <div className="flex gap-3">
          {(["DAILY", "SELECTED_DAYS"] as const).map((freq) => (
            <label
              key={freq}
              className={cn(
                "flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-md border text-sm font-medium transition-colors",
                frequencyType === freq
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-foreground border-border hover:bg-secondary/80"
              )}
            >
              <input
                type="radio"
                value={freq}
                {...register("frequencyType")}
                className="sr-only"
                disabled={isLoading}
              />
              {freq === "DAILY" ? "Daily" : "Specific Days"}
            </label>
          ))}
        </div>
      </div>

      {/* Weekday Selector (only for SELECTED_DAYS) */}
      {frequencyType === "SELECTED_DAYS" && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Select Days</label>
          <Controller
            name="selectedDays"
            control={control}
            render={({ field }) => (
              <WeekdaySelector
                selected={field.value ?? []}
                onChange={field.onChange}
                disabled={isLoading}
              />
            )}
          />
          {errors.selectedDays && (
            <p className="text-xs text-destructive">{errors.selectedDays.message}</p>
          )}
        </div>
      )}

      {/* Visibility */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Visibility</label>
        <select
          {...register("visibility")}
          disabled={isLoading}
          className="flex h-9 w-full rounded-md border border-border bg-secondary px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer"
        >
          <option value="PUBLIC">Public — Anyone can see</option>
          <option value="FOLLOWERS">Followers only</option>
          <option value="PRIVATE">Private — Only me</option>
        </select>
      </div>

      {/* Start Date */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Start Date</label>
        <Input
          type="date"
          {...register("startDate")}
          disabled={isLoading}
        />
        {errors.startDate && (
          <p className="text-xs text-destructive">{errors.startDate.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting || isLoading} className="w-full">
        {isSubmitting || isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}
