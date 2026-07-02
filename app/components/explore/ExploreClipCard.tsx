"use client";

import { useState } from "react";
import {
  ArrowBoxRightIcon,
  Button,
  Chip,
  EntityChip,
  PlayBoxedIcon,
  cn,
} from "@twelvelabs-io/react";
import type { ResolvedClip } from "@/lib/types";
import { clipDisplayTitle, clipMatchScore, clipLocationLine } from "@/lib/explore-display";
import { formatDisplayTags } from "@/lib/display-tags";
import { ClipPreviewVideo } from "./ClipPreviewVideo";
import { MatchReasoningModal } from "./MatchReasoningModal";
import { normalizeClipVideoSrc } from "@/lib/playback";
import { usePlayerStore } from "@/store/player-store";

function openClipPayload(clip: ResolvedClip) {
  return {
    videoSrc: normalizeClipVideoSrc(clip),
    startSec: clip.startSec,
    endSec: clip.endSec,
    title: clipDisplayTitle(clip),
    posterUrl: clip.thumbnailUrl,
  };
}

export function ExploreClipCard({
  clip,
  variant = "rail",
  testId,
  previewActive = true,
}: {
  clip: ResolvedClip;
  variant?: "rail" | "featured";
  testId?: string;
  previewActive?: boolean;
}) {
  const openClip = usePlayerStore((s) => s.openClip);
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const title = clipDisplayTitle(clip);
  const score = clipMatchScore(clip);
  const location = clipLocationLine(clip);
  const tags = formatDisplayTags(clip.tags ?? clip.matchSignals).slice(0, 3);

  const isFeatured = variant === "featured";
  const hasExpandableDetails =
    !isFeatured && (Boolean(clip.sceneDescription) || tags.length > 0);

  return (
    <>
      <article
        data-testid={testId}
        className={cn(
          "overflow-hidden rounded-2xl border border-border-secondary bg-surface-white",
          isFeatured
            ? "ring-1 ring-border-secondary"
            : "group explore-rail-card card-hover w-72 shrink-0",
        )}
      >
        <div className={isFeatured ? "grid md:grid-cols-2" : "flex flex-col"}>
          <div
            className={
              isFeatured
                ? "relative min-h-[280px] md:aspect-auto"
                : "relative aspect-[4/5]"
            }
          >
            <ClipPreviewVideo
              clip={clip}
              className="absolute inset-0"
              hoverPlay={!isFeatured}
              autoPlayAfterMs={isFeatured ? 1000 : undefined}
              active={previewActive}
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent p-4 pb-10">
              <h3 className="min-w-0 break-words text-lg font-normal leading-snug text-white drop-shadow">{title}</h3>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 pb-3 pt-8">
              <p className="font-tl-mono text-xs text-white/85">{location}</p>
            </div>
            {score && (
              <Chip variant="success" size="sm" mono className="absolute right-3 top-3">
                {score}
              </Chip>
            )}
            {!isFeatured && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <PlayBoxedIcon className="size-10 text-white drop-shadow" />
              </div>
            )}
          </div>

          <div
            className={
              isFeatured
                ? "flex flex-col justify-center p-6 md:p-8"
                : "explore-rail-card__body px-4 pb-4 pt-3"
            }
          >
            {isFeatured ? (
              <>
                    {clip.sceneDescription && (
                      <>
                        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-foreground-subtle">
                          Scene summary
                        </p>
                        <p className="mb-4 break-words text-sm leading-relaxed text-foreground-secondary">
                          {clip.sceneDescription}
                        </p>
                      </>
                    )}
                {tags.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <EntityChip key={tag} size="sm">
                        {tag}
                      </EntityChip>
                    ))}
                  </div>
                )}
              </>
            ) : (
              hasExpandableDetails && (
                <div className="explore-rail-card__details">
                  <div className="explore-rail-card__details-inner overflow-hidden">
                    {clip.sceneDescription && (
                      <>
                        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-foreground-subtle">
                          Scene summary
                        </p>
                        <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-foreground-secondary">
                          {clip.sceneDescription}
                        </p>
                      </>
                    )}
                    {tags.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                          <EntityChip key={tag} size="sm">
                            {tag}
                          </EntityChip>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            <div className={cn("mt-auto flex flex-wrap gap-2", !isFeatured && "pt-3")}>
              <Button
                variant="outlined-gray"
                size="sm"
                data-testid="match-reasoning-button"
                onClick={() => setReasoningOpen(true)}
              >
                Match reasoning
              </Button>
              <Button variant="primary" size="sm" onClick={() => openClip(openClipPayload(clip))}>
                Watch clip
                <ArrowBoxRightIcon className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </article>

      {reasoningOpen && (
        <MatchReasoningModal clip={clip} onClose={() => setReasoningOpen(false)} />
      )}
    </>
  );
}

export function openExploreClipPayload(clip: ResolvedClip) {
  return openClipPayload(clip);
}
