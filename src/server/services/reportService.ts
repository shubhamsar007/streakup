import { prisma } from "@/lib/prisma";

export class ReportServiceError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ReportServiceError";
  }
}

const VALID_TARGET_TYPES = ["user", "activity", "comment"] as const;
type TargetType = (typeof VALID_TARGET_TYPES)[number];

export async function createReport(
  reporterId: string,
  targetType: string,
  targetId: string,
  reason: string
): Promise<void> {
  if (!VALID_TARGET_TYPES.includes(targetType as TargetType)) {
    throw new ReportServiceError("INVALID_TYPE", "Invalid report target type");
  }

  const trimmed = reason.trim();
  if (!trimmed) throw new ReportServiceError("EMPTY_REASON", "Reason is required");
  if (trimmed.length > 1000) throw new ReportServiceError("TOO_LONG", "Reason too long");

  // Prevent self-reporting
  if (targetType === "user" && targetId === reporterId) {
    throw new ReportServiceError("SELF_REPORT", "Cannot report yourself");
  }

  // Prevent duplicate pending reports from same reporter
  const existing = await prisma.report.findFirst({
    where: { reporterId, targetType, targetId, status: "PENDING" },
  });
  if (existing) throw new ReportServiceError("DUPLICATE", "You already reported this");

  await prisma.report.create({
    data: { reporterId, targetType, targetId, reason: trimmed },
  });
}
