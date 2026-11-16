"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { MonthStat } from "@/server/services/statisticsService";

interface Props {
  data: MonthStat[];
}

export function MonthlyChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">No data yet.</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.05)" }}
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            fontSize: "12px",
            color: "var(--color-foreground)",
          }}
          formatter={(value, name) => [
            value,
            name === "completed" ? "Completed" : "Scheduled",
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}
          formatter={(value) => (value === "completed" ? "Completed" : "Scheduled")}
        />
        <Bar dataKey="scheduled" fill="var(--color-border)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="completed" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
