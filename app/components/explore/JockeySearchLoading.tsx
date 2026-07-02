"use client";

import { useEffect, useState } from "react";
import { TwelveLabsLogoMark } from "@twelvelabs-io/react";

export function JockeySearchLoading({
  seriesName,
  message,
}: {
  seriesName: string;
  message: string;
}) {
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const id = window.setInterval(() => {
      setDots((count) => (count >= 3 ? 1 : count + 1));
    }, 420);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      data-testid="jockey-search-loading"
      className="flex flex-col items-center justify-center py-16 md:py-24"
      aria-live="polite"
      aria-busy="true"
    >
      <TwelveLabsLogoMark className="jockey-loading-logo-wrap size-14 shrink-0" />
      <p className="mt-8 text-sm text-foreground-subtle">
        Jockey watching <span className="text-foreground-body">{seriesName}</span>
        <span className="inline-block w-[1.35em] text-left" aria-hidden>
          {".".repeat(dots)}
        </span>
      </p>
      <p className="mt-2 max-w-md text-center text-sm text-foreground-subtle/70">{message}</p>
    </div>
  );
}
