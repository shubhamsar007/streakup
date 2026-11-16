import { Metadata } from "next";
import { getAdminUsers } from "@/server/services/adminService";
import { AdminUsersTable } from "@/features/admin/AdminUsersTable";

export const metadata: Metadata = { title: "Admin · Users" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cursor?: string }>;
}) {
  const { q, cursor } = await searchParams;
  const { users, nextCursor } = await getAdminUsers(q, cursor);

  const serialized = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground mt-1">Search and manage platform users</p>
      </div>
      <AdminUsersTable
        initialUsers={serialized}
        initialNextCursor={nextCursor}
        initialSearch={q ?? ""}
      />
    </div>
  );
}
