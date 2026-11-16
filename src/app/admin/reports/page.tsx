import { Metadata } from "next";
import { getAdminReports } from "@/server/services/adminService";
import { AdminReportsTable } from "@/features/admin/AdminReportsTable";

export const metadata: Metadata = { title: "Admin · Reports" };

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; cursor?: string }>;
}) {
  const { status, cursor } = await searchParams;
  const { reports, nextCursor } = await getAdminReports(status, cursor);

  const serialized = reports.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    reviewedAt: r.reviewedAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Review reported content and users</p>
      </div>
      <AdminReportsTable
        initialReports={serialized}
        initialNextCursor={nextCursor}
        initialStatus={status ?? ""}
      />
    </div>
  );
}
