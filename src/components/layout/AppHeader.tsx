"use client";

import Link from "next/link";
import { Bell, Search, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AppHeaderProps {
  user?: {
    name?: string | null;
    username?: string;
    avatarUrl?: string | null;
  };
  unreadCount?: number;
}

export function AppHeader({ user, unreadCount = 0 }: AppHeaderProps) {
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b border-border bg-background/95 backdrop-blur-sm lg:pl-60">
      <div className="flex flex-1 items-center justify-between px-4 sm:px-6">
        {/* Mobile Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">StreakUp</span>
        </Link>

        {/* Search (desktop) */}
        <div className="hidden lg:flex lg:flex-1 lg:max-w-xs">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search users..."
              className="w-full rounded-lg border border-border bg-secondary py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Notification bell with badge */}
          <Link
            href="/notifications"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          <Link href="/profile">
            <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-transparent hover:ring-primary transition-all">
              {user?.avatarUrl && (
                <AvatarImage src={user.avatarUrl} alt={user.name || ""} />
              )}
              <AvatarFallback className="text-sm">{initials}</AvatarFallback>
            </Avatar>
          </Link>

        </div>
      </div>
    </header>
  );
}
