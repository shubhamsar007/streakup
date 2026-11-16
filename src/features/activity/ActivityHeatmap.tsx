"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { buildHeatmapGrid, type CalendarData } from "@/lib/calendarUtils";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_LABELS  = ["Mon","","Wed","","Fri","","Sun"];

function getCellClass(count: number, inYear: boolean, isFuture: boolean, isSelected: boolean): string {
  if (!inYear) return "opacity-0 pointer-events-none";
  if (isFuture) return "bg-secondary opacity-40 cursor-default";
  if (isSelected) return "ring-2 ring-primary ring-offset-1 ring-offset-card rounded-sm";
  if (count === 0) return "bg-secondary hover:bg-border cursor-pointer";
  if (count === 1) return "bg-success/40 hover:bg-success/50 cursor-pointer";
  if (count === 2) return "bg-success/70 hover:bg-success/80 cursor-pointer";
  return "bg-success hover:bg-success/90 cursor-pointer";
}

interface Props {
  calendarData: CalendarData;
  year: number;
  today: string; // YYYY-MM-DD
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
}

export function ActivityHeatmap({ calendarData, year, today, selectedDate, onDateSelect }: Props) {
  const weeks = buildHeatmapGrid(year);

  // Build month labels: find first column index where each month appears
  const monthLabels: { label: string; colIndex: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, i) => {
    const firstInYear = week.find((c) => c.inYear);
    if (firstInYear) {
      const m = new Date(firstInYear.date + "T00:00:00Z").getUTCMonth();
      if (m !== lastMonth) {
        lastMonth = m;
        monthLabels.push({ label: MONTH_NAMES[m]!, colIndex: i });
      }
    }
  });

  const totalCols = weeks.length;

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: `${totalCols * 14 + 36}px` }}>
        {/* Month labels */}
        <div className="flex mb-1 ml-9">
          {monthLabels.map(({ label, colIndex }, idx) => {
            const nextColIndex = monthLabels[idx + 1]?.colIndex ?? totalCols;
            const widthCols = nextColIndex - colIndex;
            return (
              <span
                key={label}
                style={{ width: `${widthCols * 14}px` }}
                className="text-xs text-muted-foreground leading-none shrink-0"
              >
                {label}
              </span>
            );
          })}
        </div>

        {/* Grid */}
        <div className="flex gap-0.5">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 mr-1 shrink-0" style={{ width: "28px" }}>
            {DAY_LABELS.map((label, i) => (
              <span
                key={i}
                className="text-xs text-muted-foreground leading-none flex items-center"
                style={{ height: "12px" }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5 shrink-0">
              {week.map((cell, di) => {
                const count = calendarData[cell.date] ?? 0;
                const isFuture = cell.date > today;
                const isSelected = cell.date === selectedDate;

                return (
                  <div
                    key={di}
                    title={
                      cell.inYear && !isFuture
                        ? `${cell.date}: ${count} completion${count !== 1 ? "s" : ""}`
                        : undefined
                    }
                    onClick={() => {
                      if (cell.inYear && !isFuture) onDateSelect?.(cell.date);
                    }}
                    className={cn(
                      "rounded-sm transition-colors",
                      getCellClass(count, cell.inYear, isFuture, isSelected)
                    )}
                    style={{ width: "12px", height: "12px" }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span>Less</span>
          {[0, 1, 2, 3].map((level) => (
            <div
              key={level}
              className={cn("rounded-sm", [
                "bg-secondary",
                "bg-success/40",
                "bg-success/70",
                "bg-success",
              ][level])}
              style={{ width: "12px", height: "12px" }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
