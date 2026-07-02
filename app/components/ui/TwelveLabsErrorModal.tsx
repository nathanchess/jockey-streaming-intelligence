"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { Button, TwelveLabsLogoMark } from "@twelvelabs-io/react";
import { useErrorStore } from "@/store/error-store";

export function TwelveLabsErrorModal() {
  const open = useErrorStore((s) => s.open);
  const title = useErrorStore((s) => s.title);
  const message = useErrorStore((s) => s.message);
  const clearError = useErrorStore((s) => s.clearError);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearError();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, clearError]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Dismiss error"
        onClick={clearError}
      />
      <div
        data-testid="twelvelabs-error-modal"
        className="relative z-10 w-full max-w-md rounded-2xl border border-border-secondary bg-surface-white p-8 text-center shadow-2xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="tl-error-title"
        aria-describedby="tl-error-message"
      >
        <TwelveLabsLogoMark className="jockey-loading-logo-wrap mx-auto size-14 shrink-0" />
        <h2 id="tl-error-title" className="mt-6 text-xl font-normal">
          {title}
        </h2>
        <p id="tl-error-message" className="mt-3 text-sm leading-relaxed text-foreground-secondary">
          {message}
        </p>
        <Button variant="primary" className="mt-6" onClick={clearError}>
          Got it — roll again
        </Button>
      </div>
    </div>,
    document.body,
  );
}
