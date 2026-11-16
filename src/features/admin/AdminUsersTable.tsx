"use client";

import { useState, useTransition, useRef } from "react";
import { format } from "date-fns";
import { Search, UserCheck, UserX, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  profile: { fullName: string; avatarUrl: string | null } | null;
  _count: { habits: number; activities: number; followers: number };
}

interface Props {
  initialUsers: AdminUser[];
  initialNextCursor: string | null;
  initialSearch: string;
}

export function AdminUsersTable({ initialUsers, initialNextCursor, initialSearch }: Props) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [search, setSearch] = useState(initialSearch);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actioningId, setActioningId] = useState<string | null>(null);
  const router = useRouter();
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(q: string) {
    setSearch(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const url = q.trim() ? `/api/v1/admin/users?q=${encodeURIComponent(q)}` : "/api/v1/admin/users";
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          setUsers(json.data.users);
          setNextCursor(json.data.nextCursor);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }

  async function loadMore() {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      params.set("cursor", nextCursor);
      const res = await fetch(`/api/v1/admin/users?${params}`);
      if (res.ok) {
        const json = await res.json();
        setUsers((prev) => [...prev, ...json.data.users]);
        setNextCursor(json.data.nextCursor);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }

  function handleStatusChange(userId: string, newStatus: "ACTIVE" | "SUSPENDED") {
    setActioningId(userId);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/admin/users/${userId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) {
          setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
          );
        }
      } finally {
        setActioningId(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by username, email, or name..."
          className="w-full max-w-sm rounded-lg border border-border bg-secondary py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Habits</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              )}
              {users.map((user) => {
                const displayName = user.profile?.fullName ?? user.username;
                const isActioning = actioningId === user.id && isPending;

                return (
                  <tr key={user.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-secondary flex-shrink-0 overflow-hidden">
                          {user.profile?.avatarUrl ? (
                            <img src={user.profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
                              {displayName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium truncate">{displayName}</span>
                            <Link href={`/u/${user.username}`} target="_blank">
                              <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </Link>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        user.role === "ADMIN"
                          ? "bg-primary/15 text-primary"
                          : "bg-secondary text-muted-foreground"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        user.status === "ACTIVE"
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive"
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{user._count.habits}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {user.role !== "ADMIN" && (
                        <button
                          onClick={() =>
                            handleStatusChange(
                              user.id,
                              user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"
                            )
                          }
                          disabled={isActioning}
                          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                            user.status === "ACTIVE"
                              ? "text-destructive hover:bg-destructive/10"
                              : "text-success hover:bg-success/10"
                          }`}
                        >
                          {isActioning ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : user.status === "ACTIVE" ? (
                            <><UserX className="h-3 w-3" /> Suspend</>
                          ) : (
                            <><UserCheck className="h-3 w-3" /> Restore</>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {nextCursor && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {isLoadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
