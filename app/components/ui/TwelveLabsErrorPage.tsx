"use client";

import { Button, TwelveLabsLogoMark } from "@twelvelabs-io/react";
import { PAGE_ERROR_MESSAGE, PAGE_ERROR_TITLE } from "@/lib/jockey-error-messages";

export function TwelveLabsErrorPage({
  reset,
}: {
  error?: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center bg-surface-muted px-6 py-16 text-center"
      data-testid="twelvelabs-error-page"
    >
      <TwelveLabsLogoMark className="jockey-loading-logo-wrap size-16 shrink-0" />
      <h1 className="mt-8 text-3xl font-normal tracking-tight">{PAGE_ERROR_TITLE}</h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-foreground-secondary">
        {PAGE_ERROR_MESSAGE}
      </p>
      <Button variant="primary" className="mt-8" onClick={reset}>
        Retry the take
      </Button>
    </div>
  );
}
