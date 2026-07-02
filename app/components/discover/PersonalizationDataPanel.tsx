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
import type { ApiExchange, ResolvedClip, StoreKey, ViewerProfileId } from "@/lib/types";
import type { PersonalizationConfig } from "@/lib/personalization-config";
import {
  buildPersonalizationClipRows,
  buildPersonalizationExportPayload,
  downloadPersonalizationJson,
} from "@/lib/personalization-export";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  storeKey: StoreKey;
  profileId: ViewerProfileId;
  config: PersonalizationConfig;
  source: "cache" | "live";
  clips: ResolvedClip[];
  exchange: ApiExchange | null;
};

export function PersonalizationDataModal({
  open,
  onClose,
  storeKey,
  profileId,
  config,
  source,
  clips,
  exchange,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const rows = useMemo(() => buildPersonalizationClipRows(clips), [clips]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const main = document.querySelector("main");
    const prevBody = document.body.style.overflow;
    const prevMain = main?.style.overflow ?? "";
    document.body.style.overflow = "hidden";
    if (main) main.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevBody;
      if (main) main.style.overflow = prevMain;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex h-dvh overflow-hidden">
      <button
        type="button"
        aria-label="Close personalization data"
        className="metadata-backdrop-enter min-w-0 flex-1 bg-black/45"
        onClick={onClose}
      />
      <div
        data-testid="personalization-data-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="personalization-data-panel-title"
        className="metadata-drawer-enter relative z-10 flex h-dvh w-full flex-col overflow-hidden border-l border-border-secondary bg-surface-white shadow-2xl sm:w-[min(62vw,820px)] sm:min-w-[480px] sm:shrink-0"
      >
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border-secondary px-5 py-4">
          <div>
            <p id="personalization-data-panel-title" className="text-sm font-medium">
              Personalization results data
            </p>
            <p className="text-xs text-foreground-subtle">
              {rows.length} clip{rows.length === 1 ? "" : "s"} · {source} · {profileId}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outlined-gray"
              size="sm"
              data-testid="personalization-export-json"
              disabled={rows.length === 0}
              onClick={() =>
                downloadPersonalizationJson(
                  buildPersonalizationExportPayload({
                    storeKey,
                    profileId,
                    config,
                    clips,
                    exchange,
                    source,
                  }),
                  `${storeKey}-${profileId}-personalization.json`,
                )
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

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4">
          {rows.length === 0 ? (
            <p className="py-6 text-sm text-foreground-subtle">
              No clips to export yet. Run discovery or switch profiles to load a rail.
            </p>
          ) : (
            <table className="w-full table-fixed text-left text-xs">
              <thead className="sticky top-0 z-10 bg-surface-white">
                <tr className="border-b border-border-secondary">
                  <th className="w-[28%] px-2 py-2.5 font-medium text-foreground-subtle">Clip</th>
                  <th className="w-[24%] px-2 py-2.5 font-medium text-foreground-subtle">Location</th>
                  <th className="w-[22%] px-2 py-2.5 font-medium text-foreground-subtle">Interests</th>
                  <th className="w-[18%] px-2 py-2.5 font-medium text-foreground-subtle">Avoided</th>
                  <th className="w-[8%] px-2 py-2.5 font-medium text-foreground-subtle">Fit</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border-secondary last:border-0">
                    <td className="px-2 py-2.5 align-top">
                      <p className="font-medium leading-snug text-foreground-body">{row.title}</p>
                    </td>
                    <td className="px-2 py-2.5 align-top font-tl-mono text-[11px] leading-snug text-foreground-secondary">
                      {row.episode} · {row.timestamp_start} – {row.timestamp_end}
                    </td>
                    <td className="break-words px-2 py-2.5 align-top leading-snug text-foreground-secondary">
                      {row.matched_interests.slice(0, 3).join(", ") || "—"}
                    </td>
                    <td className="break-words px-2 py-2.5 align-top leading-snug text-foreground-secondary">
                      {row.avoided_themes.slice(0, 2).join(", ") || "—"}
                    </td>
                    <td className="px-2 py-2.5 align-top font-tl-mono text-foreground-body">
                      {row.audience_fit ? `${row.audience_fit}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function PersonalizationDataToggle({
  open,
  onToggle,
  disabled,
  className,
}: {
  open: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <IconButton
      type="button"
      variant="outlined-gray"
      size="regular"
      data-testid="personalization-data-toggle"
      aria-expanded={open}
      aria-label={open ? "Close personalization results data" : "View personalization results data"}
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
