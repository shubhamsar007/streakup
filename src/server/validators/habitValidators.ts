import { z } from "zod";

const today = new Date().toISOString().split("T")[0];

export const createHabitSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
    description: z.string().max(500, "Description must be at most 500 characters").optional(),
    category: z.string().min(1, "Category is required"),
    icon: z.string().optional(),
    trackingType: z.enum(["CHECKBOX", "COUNT", "DURATION"]),
    targetValue: z.number().positive("Target value must be positive").optional(),
    unit: z.string().optional(),
    visibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]),
    frequencyType: z.enum(["DAILY", "SELECTED_DAYS"]),
    selectedDays: z
      .array(z.number().int().min(1).max(7))
      .min(1, "Select at least one day")
      .optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD format")
      .default(today),
  })
  .superRefine((data, ctx) => {
    if (
      (data.trackingType === "COUNT" || data.trackingType === "DURATION") &&
      data.targetValue === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Target value is required for COUNT and DURATION tracking types",
        path: ["targetValue"],
      });
    }
    if (data.frequencyType === "SELECTED_DAYS" && !data.selectedDays?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selected days are required when frequency type is SELECTED_DAYS",
        path: ["selectedDays"],
      });
    }
  });

export const updateHabitSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters").optional(),
    description: z.string().max(500, "Description must be at most 500 characters").optional(),
    category: z.string().min(1, "Category is required").optional(),
    icon: z.string().optional(),
    trackingType: z.enum(["CHECKBOX", "COUNT", "DURATION"]).optional(),
    targetValue: z.number().positive("Target value must be positive").optional(),
    unit: z.string().optional(),
    visibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]).optional(),
    frequencyType: z.enum(["DAILY", "SELECTED_DAYS"]).optional(),
    selectedDays: z
      .array(z.number().int().min(1).max(7))
      .min(1, "Select at least one day")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.frequencyType === "SELECTED_DAYS" && !data.selectedDays?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selected days are required when frequency type is SELECTED_DAYS",
        path: ["selectedDays"],
      });
    }
  });

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
