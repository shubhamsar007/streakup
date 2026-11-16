"use client";

import { useState } from "react";
import Link from "next/link";
import { Flame, Trophy, ChevronUp, ChevronDown } from "lucide-react";
import type { HabitStat } from "@/server/services/statisticsService";

type SortKey = "name" | "currentStreak" | "longestStreak" | "completionRate" | "totalCompleted";

interface Props {
  habits: HabitStat[];
}

export function HabitStatsTable({ habits }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("completionRate");
  const [sortAsc, setSortAsc] = useState(false);

  if (habits.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">No habits yet.</p>
    );
  }

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc((p) => !p);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  const sorted = [...habits].sort((a, b) => {
    let v = 0;
    if (sortKey === "name") v = a.name.localeCompare(b.name);
    else v = (a[sortKey] as number) - (b[sortKey] as number);
    return sortAsc ? v : -v;
  });

  function SortIcon({ col }: { col: SortKey }) {
    if (col !== sortKey) return null;
    return sortAsc
      ? <ChevronUp className="h-3 w-3 inline ml-0.5" />
      : <ChevronDown className="h-3 w-3 inline ml-0.5" />;
  }

  function HeaderCell({ label, col }: { label: string; col: SortKey }) {
    return (
      <th
        onClick={() => toggleSort(col)}
        className="text-left text-xs font-medium text-muted-foreground px-3 py-2.5 cursor-pointer hover:text-foreground transition-colors whitespace-nowrap select-none"
      >
        {label}<SortIcon col={col} />
      </th>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <HeaderCell label="Habit" col="name" />
            <HeaderCell label="Current Streak" col="currentStreak" />
            <HeaderCell label="Best Streak" col="longestStreak" />
            <HeaderCell label="Completion" col="completionRate" />
            <HeaderCell label="Total Days" col="totalCompleted" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((h) => (
            <tr key={h.id} className="hover:bg-secondary/50 transition-colors">
              <td className="px-3 py-2.5">
                <Link href={`/habits/${h.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                  {h.name}
                </Link>
                <span className="ml-2 text-xs text-muted-foreground">{h.category}</span>
              </td>
              <td className="px-3 py-2.5">
                <span className="inline-flex items-center gap-1 text-foreground">
                  <Flame className="h-3.5 w-3.5 text-primary" />
                  {h.currentStreak}d
                </span>
              </td>
              <td className="px-3 py-2.5">
                <span className="inline-flex items-center gap-1 text-foreground">
                  <Trophy className="h-3.5 w-3.5 text-warning" />
                  {h.longestStreak}d
                </span>
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-secondary rounded-full h-1.5 max-w-[80px]">
                    <div
                      className="h-1.5 rounded-full bg-primary transition-all"
                      style={{ width: `${h.completionRate}%` }}
                    />
                  </div>
                  <span className={
                    h.completionRate >= 80 ? "text-success font-medium" :
                    h.completionRate >= 50 ? "text-foreground" :
                    "text-muted-foreground"
                  }>
                    {h.eligibleDays > 0 ? `${h.completionRate}%` : "—"}
                  </span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-muted-foreground">
                {h.totalCompleted}
                {h.eligibleDays > 0 && (
                  <span className="text-xs"> / {h.eligibleDays}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
