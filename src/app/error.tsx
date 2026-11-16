"use client";

import { useEffect } from "react";
import { RefreshCw, Zap } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service in production
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-6">
        <Zap className="h-6 w-6 text-primary-foreground" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-3">Something went wrong</h1>
      <p className="text-muted-foreground max-w-sm mb-8">
        An unexpected error occurred. Try refreshing — if the problem persists, it&apos;s on our end.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground mb-6 font-mono">Error ID: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}
