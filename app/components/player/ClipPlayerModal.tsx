"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CloseIcon, IconButton } from "@twelvelabs-io/react";
import { usePlayerStore } from "@/store/player-store";
import { TlVideoPlayer } from "./TlVideoPlayer";

export function ClipPlayerModal() {
  const { open, videoSrc, startSec, endSec, title, posterUrl, close } = usePlayerStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  if (!open || !videoSrc || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close player"
        onClick={close}
      />
      <div
        data-testid="clip-player-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clip-player-title"
        className="modal-panel-enter relative flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-surface-white shadow-2xl ring-1 ring-border-secondary"
      >
        <div className="relative z-20 flex shrink-0 items-center justify-between gap-3 border-b border-border-secondary px-4 py-3">
          <h2 id="clip-player-title" className="min-w-0 truncate text-sm font-medium text-foreground-body">
            {title}
          </h2>
          <IconButton variant="outlined-gray" size="regular" aria-label="Close" onClick={close}>
            <CloseIcon className="size-4" />
          </IconButton>
        </div>
        <div className="relative z-0 min-h-0 flex-1 overflow-y-auto">
          <TlVideoPlayer
            videoSrc={videoSrc}
            startSec={startSec}
            endSec={endSec}
            posterUrl={posterUrl}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
