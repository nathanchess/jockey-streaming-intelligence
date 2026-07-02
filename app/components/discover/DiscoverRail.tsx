"use client";

import type { ReactNode } from "react";

export function DiscoverRail({
  children,
  testId,
}: {
  children: ReactNode;
  testId?: string;
}) {
  return (
    <div className="discover-rail-grid" data-testid={testId}>
      {children}
    </div>
  );
}
