"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Users, User, Plus, X, Repeat2, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavigationProps {
  user?: {
    username?: string;
    avatarUrl?: string | null;
    name?: string | null;
  };
}

const leftNavItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/habits", icon: BookOpen, label: "Habits" },
];

const rightNavItems = [
  { href: "/community", icon: Users, label: "Community" },
];

export function MobileNavigation({ user }: MobileNavigationProps) {
  const pathname = usePathname();
  const [showCreate, setShowCreate] = useState(false);

  const profileHref = user?.username ? `/u/${user.username}` : "/profile";
  const isProfileActive = pathname === "/profile" || pathname.startsWith("/u/");
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <>
      {/* Backdrop */}
      {showCreate && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowCreate(false)}
        />
      )}

      {/* Create bottom sheet */}
      {showCreate && (
        <div className="fixed bottom-[80px] left-4 right-4 z-50 rounded-2xl bg-card border border-border p-4 shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center mb-4">
            What do you want to create?
          </p>
          <div className="space-y-3">
            <Link
              href="/habits/new"
              onClick={() => setShowCreate(false)}
              className="flex items-center gap-4 rounded-xl bg-secondary p-4 active:scale-[0.98] transition-transform"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Repeat2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Habit</p>
                <p className="text-sm text-muted-foreground">Repeating — daily, weekly or more</p>
              </div>
            </Link>

            <Link
              href="/tasks?new=true"
              onClick={() => setShowCreate(false)}
              className="flex items-center gap-4 rounded-xl bg-secondary p-4 active:scale-[0.98] transition-transform"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Task</p>
                <p className="text-sm text-muted-foreground">One-time — due today or any date</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-secondary/95 backdrop-blur-sm lg:hidden">
        <div className="grid grid-cols-5 items-end px-1 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {leftNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 justify-end py-2 pb-1 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-6 w-6 shrink-0", isActive && "stroke-[2.25]")} />
                <span className={cn("text-[11px] font-medium", isActive && "font-semibold")}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Center create button */}
          <div className="flex justify-center items-end pb-1">
            <button
              onClick={() => setShowCreate((v) => !v)}
              className={cn(
                "flex items-center justify-center w-14 h-14 rounded-full transition-all -translate-y-3 shadow-lg",
                showCreate
                  ? "bg-foreground text-background shadow-foreground/20"
                  : "bg-primary text-primary-foreground shadow-primary/40"
              )}
              aria-label="Create"
            >
              {showCreate ? <X className="h-6 w-6" /> : <Plus className="h-7 w-7" />}
            </button>
          </div>

          {rightNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 justify-end py-2 pb-1 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-6 w-6 shrink-0", isActive && "stroke-[2.25]")} />
                <span className={cn("text-[11px] font-medium", isActive && "font-semibold")}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* "You" tab with avatar */}
          <Link
            href={profileHref}
            className={cn(
              "flex flex-col items-center gap-1 justify-end py-2 pb-1 transition-colors",
              isProfileActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className={cn(
              "h-6 w-6 rounded-full overflow-hidden shrink-0",
              isProfileActive && "ring-2 ring-primary ring-offset-1 ring-offset-background"
            )}>
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="You" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-secondary text-muted-foreground">
                  {user?.name ? (
                    <span className="text-[9px] font-bold">{initials}</span>
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
              )}
            </div>
            <span className={cn("text-[11px] font-medium", isProfileActive && "font-semibold")}>
              You
            </span>
          </Link>
        </div>
      </nav>
    </>
  );
}
