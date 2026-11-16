import { Metadata } from "next";
import { getAdminDashboardStats } from "@/server/services/adminService";
import { Users, Activity, Flame, CheckSquare, Flag, UserX } from "lucide-react";
import { format } from "date-fns";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { label: "Active Users", value: stats.activeUsers, icon: Activity, color: "text-success" },
    { label: "Suspended", value: stats.suspendedUsers, icon: UserX, color: "text-destructive" },
    { label: "Total Habits", value: stats.totalHabits, icon: Flame, color: "text-warning" },
    { label: "Total Completions", value: stats.totalCompletions, icon: CheckSquare, color: "text-primary" },
    { label: "Pending Reports", value: stats.pendingReports, icon: Flag, color: stats.pendingReports > 0 ? "text-destructive" : "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4">
            <card.icon className={`h-5 w-5 mb-2 ${card.color}`} />
            <p className="text-2xl font-bold text-foreground">{card.value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Recent registrations */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-sm">Recent Registrations</h2>
          <a href="/admin/users" className="text-xs text-primary hover:underline">
            View all →
          </a>
        </div>
        <div className="divide-y divide-border">
          {stats.recentRegistrations.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">No users yet.</p>
          )}
          {stats.recentRegistrations.map((user) => (
            <div key={user.id} className="flex items-center gap-3 px-4 py-3">
              <div className="h-8 w-8 rounded-full bg-secondary flex-shrink-0 overflow-hidden">
                {user.profile?.avatarUrl ? (
                  <img src={user.profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
                    {(user.profile?.fullName ?? user.username).charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.profile?.fullName ?? user.username}</p>
                <p className="text-xs text-muted-foreground">@{user.username} · {user.email}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  user.status === "ACTIVE"
                    ? "bg-success/15 text-success"
                    : "bg-destructive/15 text-destructive"
                }`}>
                  {user.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(user.createdAt), "MMM d")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
