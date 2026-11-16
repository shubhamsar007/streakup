"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, Circle, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DateDetail {
  date: string;
  scheduledHabits: { id: string; name: string; category: string; isCompleted: boolean }[];
  tasks: { id: string; title: string; status: string }[];
}

interface Props {
  date: string | null;
  onClose: () => void;
}

export function DateDetailPanel({ date, onClose }: Props) {
  const [detail, setDetail] = useState<DateDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) {
      setDetail(null);
      return;
    }
    setLoading(true);
    fetch(`/api/v1/activity/date?date=${date}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setDetail(json.data);
      })
      .finally(() => setLoading(false));
  }, [date]);

  if (!date) return null;

  const displayDate = new Date(date + "T00:00:00Z").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  const completed = detail?.scheduledHabits.filter((h) => h.isCompleted) ?? [];
  const missed    = detail?.scheduledHabits.filter((h) => !h.isCompleted) ?? [];

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{displayDate}</CardTitle>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-8 rounded-md bg-secondary animate-pulse" />
            ))}
          </div>
        ) : detail === null ? (
          <p className="text-sm text-muted-foreground">No data for this date.</p>
        ) : (
          <div className="space-y-4">
            {/* Habits */}
            {detail.scheduledHabits.length === 0 ? (
              <p className="text-xs text-muted-foreground">No habits scheduled on this day.</p>
            ) : (
              <div className="space-y-1">
                {completed.map((h) => (
                  <div key={h.id} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 shrink-0 text-success" />
                    <span className="text-foreground">{h.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{h.category}</span>
                  </div>
                ))}
                {missed.map((h) => (
                  <div key={h.id} className="flex items-center gap-2 text-sm">
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground line-through">{h.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{h.category}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tasks */}
            {detail.tasks.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <ClipboardList className="h-3.5 w-3.5" /> Tasks
                </p>
                <div className="space-y-1">
                  {detail.tasks.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 text-sm">
                      {t.status === "COMPLETED" ? (
                        <CheckCircle className="h-4 w-4 shrink-0 text-success" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span
                        className={
                          t.status === "COMPLETED"
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                        }
                      >
                        {t.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary row */}
            {detail.scheduledHabits.length > 0 && (
              <div className="flex gap-4 pt-2 border-t border-border text-xs text-muted-foreground">
                <span>
                  <span className="font-medium text-success">{completed.length}</span> completed
                </span>
                <span>
                  <span className="font-medium text-destructive">{missed.length}</span> missed
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
