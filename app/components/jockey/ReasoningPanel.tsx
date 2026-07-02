"use client";

import { Chip } from "@twelvelabs-io/react";

export function ReasoningPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border-secondary bg-surface-muted p-3">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-foreground-subtle">
        {title}
      </p>
      <div className="min-w-0 text-sm leading-relaxed break-words text-foreground-body">{children}</div>
    </div>
  );
}

export function MatchSignalsChips({ signals }: { signals?: string[] }) {
  if (!signals?.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {signals.map((s) => (
        <Chip key={s} variant="gray-outline" size="sm">
          {s}
        </Chip>
      ))}
    </div>
  );
}
