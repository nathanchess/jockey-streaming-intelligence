import { cn } from "@twelvelabs-io/react";

export function PanelContentSkeleton({
  variant = "explore",
  className,
}: {
  variant?: "explore" | "discover" | "program";
  className?: string;
}) {
  return (
    <div
      className={cn("animate-pulse space-y-8", className)}
      data-testid="panel-content-skeleton"
      aria-busy="true"
      aria-label="Loading content"
    >
      {variant === "explore" && (
        <>
          <div className="space-y-3">
            <div className="h-5 w-48 rounded-lg bg-surface-muted" />
            <div className="h-4 w-72 max-w-full rounded-lg bg-surface-muted" />
            <div className="mt-4 flex gap-3 overflow-hidden">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 w-72 shrink-0 rounded-2xl bg-surface-muted"
                />
              ))}
            </div>
          </div>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-4 w-40 rounded-lg bg-surface-muted" />
              <div className="flex gap-3 overflow-hidden">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div
                    key={j}
                    className="h-80 w-72 shrink-0 rounded-2xl bg-surface-muted"
                  />
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {variant === "discover" && (
        <>
          <div className="h-40 rounded-2xl bg-surface-muted" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 w-72 shrink-0 rounded-2xl bg-surface-muted" />
            ))}
          </div>
        </>
      )}

      {variant === "program" && (
        <>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 rounded-2xl border border-border-secondary p-4">
              <div className="h-20 w-32 shrink-0 rounded-lg bg-surface-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-16 rounded bg-surface-muted" />
                <div className="h-5 w-3/4 max-w-sm rounded bg-surface-muted" />
                <div className="h-4 w-full rounded bg-surface-muted" />
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
