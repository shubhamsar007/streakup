"use client";

import { useState, useTransition } from "react";
import { Flag, X } from "lucide-react";

type TargetType = "user" | "activity" | "comment";

interface Props {
  targetType: TargetType;
  targetId: string;
  className?: string;
}

export function ReportButton({ targetType, targetId, className }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim() || isPending) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/v1/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetType, targetId, reason: reason.trim() }),
        });
        const json = await res.json();
        if (res.ok) {
          setSubmitted(true);
          setReason("");
        } else {
          setError(json.error?.message ?? "Something went wrong");
        }
      } catch {
        setError("Something went wrong");
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors ${className ?? ""}`}
      >
        <Flag className="h-3.5 w-3.5" />
        Report
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Report {targetType}</h3>
        <button onClick={() => { setOpen(false); setSubmitted(false); setError(null); setReason(""); }}>
          <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </button>
      </div>

      {submitted ? (
        <p className="text-sm text-success">Thank you. Your report has been submitted.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe why you're reporting this..."
            maxLength={1000}
            rows={3}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason.trim() || isPending}
              className="rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
            >
              Submit Report
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
