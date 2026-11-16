"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Loader2, CheckCircle, XCircle, AlertTriangle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminReport {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  reporter: {
    id: string;
    username: string;
    profile: { fullName: string } | null;
  };
}

interface Props {
  initialReports: AdminReport[];
  initialNextCursor: string | null;
  initialStatus: string;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-warning/15 text-warning",
  REVIEWED: "bg-primary/15 text-primary",
  DISMISSED: "bg-secondary text-muted-foreground",
  ACTIONED: "bg-success/15 text-success",
};

export function AdminReportsTable({ initialReports, initialNextCursor, initialStatus }: Props) {
  const [reports, setReports] = useState<AdminReport[]>(initialReports);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [filterStatus, setFilterStatus] = useState(initialStatus);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actioningId, setActioningId] = useState<string | null>(null);

  async function handleFilterChange(status: string) {
    setFilterStatus(status);
    setIsFiltering(true);
    try {
      const url = status ? `/api/v1/admin/reports?status=${status}` : "/api/v1/admin/reports";
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setReports(json.data.reports);
        setNextCursor(json.data.nextCursor);
      }
    } finally {
      setIsFiltering(false);
    }
  }

  async function loadMore() {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      params.set("cursor", nextCursor);
      const res = await fetch(`/api/v1/admin/reports?${params}`);
      if (res.ok) {
        const json = await res.json();
        setReports((prev) => [...prev, ...json.data.reports]);
        setNextCursor(json.data.nextCursor);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }

  function handleAction(
    reportId: string,
    newStatus: "REVIEWED" | "DISMISSED" | "ACTIONED",
    opts?: { deleteTarget?: boolean; targetType?: string; targetId?: string }
  ) {
    setActioningId(reportId);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/admin/reports/${reportId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            deleteTarget: opts?.deleteTarget ?? false,
            targetType: opts?.targetType,
            targetId: opts?.targetId,
          }),
        });
        if (res.ok) {
          setReports((prev) =>
            prev.map((r) =>
              r.id === reportId
                ? { ...r, status: newStatus, reviewedAt: new Date().toISOString() }
                : r
            )
          );
        }
      } finally {
        setActioningId(null);
      }
    });
  }

  const filterOptions = [
    { value: "", label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "REVIEWED", label: "Reviewed" },
    { value: "DISMISSED", label: "Dismissed" },
    { value: "ACTIONED", label: "Actioned" },
  ];

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleFilterChange(opt.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              filterStatus === opt.value
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            {opt.label}
          </button>
        ))}
        {isFiltering && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground self-center ml-1" />}
      </div>

      {/* Reports list */}
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {reports.length === 0 && (
          <div className="px-4 py-10 text-center text-muted-foreground">
            No reports found.
          </div>
        )}
        {reports.map((report) => {
          const reporterName = report.reporter.profile?.fullName ?? report.reporter.username;
          const isActioning = actioningId === report.id && isPending;
          const isPendingReport = report.status === "PENDING";

          return (
            <div key={report.id} className="p-4 space-y-3">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">
                      Report: <span className="font-mono text-xs text-muted-foreground">{report.targetType}</span>
                    </span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", statusColors[report.status] ?? "bg-secondary text-muted-foreground")}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Reported by @{report.reporter.username} · {format(new Date(report.createdAt), "MMM d, yyyy HH:mm")}
                    {report.reviewedAt && ` · Reviewed ${format(new Date(report.reviewedAt), "MMM d")}`}
                  </p>
                </div>
              </div>

              {/* Reason */}
              <p className="text-sm text-foreground/80 bg-secondary/50 rounded-lg px-3 py-2">
                {report.reason}
              </p>

              {/* Target ID */}
              <p className="text-xs text-muted-foreground font-mono">
                Target ID: {report.targetId}
              </p>

              {/* Actions (only for pending) */}
              {isPendingReport && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleAction(report.id, "DISMISSED")}
                    disabled={isActioning}
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                  >
                    {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleAction(report.id, "REVIEWED")}
                    disabled={isActioning}
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                  >
                    {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                    Mark Reviewed
                  </button>
                  {(report.targetType === "activity" || report.targetType === "comment") && (
                    <button
                      onClick={() =>
                        handleAction(report.id, "ACTIONED", {
                          deleteTarget: true,
                          targetType: report.targetType,
                          targetId: report.targetId,
                        })
                      }
                      disabled={isActioning}
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    >
                      {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Remove Content
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
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
