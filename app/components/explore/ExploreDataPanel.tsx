"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Button,
  CloseIcon,
  DownloadIcon,
  GridIcon,
  IconButton,
  cn,
} from "@twelvelabs-io/react";
import type { ApiExchange, ResolvedClip, StoreKey } from "@/lib/types";
import { buildExploreClipRows, downloadExploreJson } from "@/lib/explore-export";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  storeKey: StoreKey;
  mode: "browse" | "search";
  query: string;
  presetId: string | null;
  interpretation: string;
  clips: ResolvedClip[];
  exchange: ApiExchange | null;
};

export function ExploreDataModal({
  open,
  onClose,
  storeKey,
  mode,
  query,
  presetId,
  interpretation,
  clips,
  exchange,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const rows = useMemo(() => buildExploreClipRows(clips), [clips]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const main = document.getElementById("store-main");
    const prevMain = main?.style.overflow ?? "";
    if (main) main.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      if (main) main.style.overflow = prevMain;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const root = document.getElementById("store-main");
  if (!root) return null;

  return createPortal(
    <div className="absolute inset-0 z-[70] flex items-center justify-center p-4 md:p-8">
      <button
        type="button"
        aria-label="Close explore data"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        data-testid="explore-data-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="explore-data-panel-title"
        className="relative z-10 flex max-h-[85dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border-secondary bg-surface-white shadow-2xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-secondary px-4 py-3">
          <div>
            <p id="explore-data-panel-title" className="text-sm font-medium">
              Explore results data
            </p>
            <p className="text-xs text-foreground-subtle">
              {rows.length} clip{rows.length === 1 ? "" : "s"} · {mode === "browse" ? "browse" : "search"} mode
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outlined-gray"
              size="sm"
              data-testid="explore-export-json"
              disabled={rows.length === 0}
              onClick={() =>
                downloadExploreJson({
                  storeKey,
                  mode,
                  query,
                  presetId,
                  interpretation,
                  clips,
                  exchange,
                })
              }
            >
              <DownloadIcon className="size-3.5" />
              Export JSON
            </Button>
            <IconButton variant="outlined-gray" size="regular" aria-label="Close" onClick={onClose}>
              <CloseIcon className="size-4" />
            </IconButton>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {rows.length === 0 ? (
            <p className="px-4 py-6 text-sm text-foreground-subtle">
              No clips to export yet. Run a search or load browse highlights.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-xs">
                <thead className="sticky top-0 bg-surface-muted/95 backdrop-blur-sm">
                  <tr className="border-b border-border-secondary">
                    <th className="px-4 py-2.5 font-medium text-foreground-subtle">Scene</th>
                    <th className="px-4 py-2.5 font-medium text-foreground-subtle">Location</th>
                    <th className="px-4 py-2.5 font-medium text-foreground-subtle">Score</th>
                    <th className="px-4 py-2.5 font-medium text-foreground-subtle">Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-border-secondary last:border-0">
                      <td className="max-w-xs break-words px-4 py-2.5 align-top">
                        <p className="font-medium text-foreground-body">{row.scene_title}</p>
                        {row.scene_description && (
                          <p className="mt-1 line-clamp-2 break-words text-foreground-subtle">
                            {row.scene_description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2.5 align-top font-tl-mono text-foreground-secondary">
                        {row.episode} · {row.timestamp_start} – {row.timestamp_end}
                      </td>
                      <td className="px-4 py-2.5 align-top font-tl-mono text-foreground-body">
                        {row.match_score ?? "—"}
                      </td>
                      <td className="break-words px-4 py-2.5 align-top text-foreground-secondary">
                        {row.tags.slice(0, 3).join(", ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>,
    root,
  );
}

type ToggleProps = {
  open: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
};

export function ExploreDataToggle({ open, onToggle, disabled, className }: ToggleProps) {
  return (
    <IconButton
      type="button"
      variant="outlined-gray"
      size="regular"
      data-testid="explore-data-toggle"
      aria-expanded={open}
      aria-label={open ? "Close explore results data" : "View explore results data"}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "size-11 shrink-0 rounded-2xl",
        open && "border-foreground-subtle bg-surface-muted",
        className,
      )}
    >
      <GridIcon className="size-4" />
    </IconButton>
  );
}
