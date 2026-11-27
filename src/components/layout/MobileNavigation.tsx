"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Users, User, Plus, X, Repeat2, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

const leftNavItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/habits", icon: BookOpen, label: "Habits" },
];

const rightNavItems = [
  { href: "/community", icon: Users, label: "Community" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function MobileNavigation() {
  const pathname = usePathname();
  const [showCreate, setShowCreate] = useState(false);

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
        <div className="flex items-center justify-around px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {leftNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 min-w-[56px] min-h-[48px] justify-center rounded-xl px-3 py-1.5 transition-colors",
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
          <button
            onClick={() => setShowCreate((v) => !v)}
            className={cn(
              "flex items-center justify-center w-14 h-14 rounded-full transition-all -mt-5 shadow-lg",
              showCreate
                ? "bg-foreground text-background shadow-foreground/20"
                : "bg-primary text-primary-foreground shadow-primary/40"
            )}
            aria-label="Create"
          >
            {showCreate ? <X className="h-6 w-6" /> : <Plus className="h-7 w-7" />}
          </button>

          {rightNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 min-w-[56px] min-h-[48px] justify-center rounded-xl px-3 py-1.5 transition-colors",
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
        </div>
      </nav>
    </>
  );
}
