"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import {
  CloseIcon,
  EntityChip,
  IconButton,
} from "@twelvelabs-io/react";
import type { ResolvedClip } from "@/lib/types";
import { formatTimestamp } from "@/lib/types";
import { clipDisplayTitle, clipMatchScore } from "@/lib/explore-display";
import { formatDisplayTags } from "@/lib/display-tags";

export function MatchReasoningModal({
  clip,
  onClose,
}: {
  clip: ResolvedClip;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const title = clipDisplayTitle(clip);
  const score = clipMatchScore(clip);
  const tags = formatDisplayTags(clip.tags ?? clip.matchSignals);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close match reasoning"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
      />
      <div
        data-testid="match-reasoning-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-reasoning-title"
        className="relative z-10 max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border-secondary bg-surface-white p-6 shadow-2xl sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-foreground-subtle">Match reasoning</p>
            <h3 id="match-reasoning-title" className="text-lg font-normal leading-snug">
              {title}
            </h3>
          </div>
          <IconButton variant="outlined-gray" size="regular" aria-label="Close" onClick={onClose}>
            <CloseIcon className="size-4" />
          </IconButton>
        </div>

        {score && (
          <p className="mb-3 font-tl-mono text-sm text-foreground-status-success">{score} match</p>
        )}

        {clip.sceneDescription && (
          <p className="mb-4 text-sm leading-relaxed break-words text-foreground-secondary">
            {clip.sceneDescription}
          </p>
        )}

        {clip.alignmentReasoning && (
          <div className="mb-4 break-words rounded-xl border border-border-secondary bg-surface-muted p-4 text-sm leading-relaxed text-foreground-body">
            {clip.alignmentReasoning}
          </div>
        )}

        {clip.charactersPresent && clip.charactersPresent.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs text-foreground-subtle">Characters in scene</p>
            <div className="flex flex-wrap gap-2">
              {clip.charactersPresent.map((name) => (
                <EntityChip key={name} size="sm">
                  {name}
                </EntityChip>
              ))}
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs text-foreground-subtle">Tags</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <EntityChip key={tag} size="sm">
                  {tag}
                </EntityChip>
              ))}
            </div>
          </div>
        )}

        <p className="font-tl-mono text-xs text-foreground-subtle">
          {formatTimestamp(clip.startSec)} – {formatTimestamp(clip.endSec)}
          {clip.matchType ? ` · ${clip.matchType}` : ""}
        </p>
      </div>
    </div>,
    document.body,
  );
}
