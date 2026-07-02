"use client";

import { useState } from "react";
import {
  AnalyzeIcon,
  ArrowBoxRightIcon,
  Button,
  Chip,
  EntityChip,
  PlayBoxedIcon,
} from "@twelvelabs-io/react";
import type { ResolvedClip } from "@/lib/types";
import { clipLocationLine } from "@/lib/explore-display";
import { formatDisplayTags } from "@/lib/display-tags";
import { normalizeClipVideoSrc } from "@/lib/playback";
import { ClipPreviewVideo } from "@/components/explore/ClipPreviewVideo";
import { PersonalizationReasoningModal } from "@/components/discover/PersonalizationReasoningModal";
import { usePlayerStore } from "@/store/player-store";

function openClipPayload(clip: ResolvedClip) {
  return {
    videoSrc: normalizeClipVideoSrc(clip),
    startSec: clip.startSec,
    endSec: clip.endSec,
    title: clip.title,
    posterUrl: clip.thumbnailUrl,
  };
}

export function DiscoverClipCard({
  clip,
  rank,
}: {
  clip: ResolvedClip;
  rank: number;
}) {
  const openClip = usePlayerStore((s) => s.openClip);
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const metadata = clip.personalizationMetadata;
  const location = clipLocationLine(clip);
  const tags = formatDisplayTags(clip.matchSignals).slice(0, 3);
  const hasExpandableDetails = Boolean(clip.subClipFocus || tags.length > 0);

  return (
    <>
      <article
        data-testid="discover-rail-card"
        className="group discover-rail-card w-80 max-w-full overflow-hidden rounded-2xl border border-border-secondary bg-surface-white shadow-sm"
      >
        <div className="relative aspect-[4/5]">
          <ClipPreviewVideo clip={clip} className="absolute inset-0" hoverPlay active />
          <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent p-4 pb-12">
            <div className="flex items-start gap-2.5">
              <Chip size="sm" variant="success" className="shrink-0">
                #{rank}
              </Chip>
              <h3 className="min-w-0 flex-1 text-lg font-normal leading-snug text-white drop-shadow">
                {clip.title}
              </h3>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 pb-3 pt-10">
            <p className="font-tl-mono text-xs text-white/85">{location}</p>
          </div>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <PlayBoxedIcon className="size-10 text-white drop-shadow" />
          </div>
        </div>

        <div className="px-4 pb-4 pt-3">
          {hasExpandableDetails && (
            <div className="mb-3">
              {clip.subClipFocus && (
                <>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-foreground-subtle">
                    Clip focus
                  </p>
                  <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-foreground-secondary">
                    {clip.subClipFocus}
                  </p>
                </>
              )}
              {tags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <EntityChip key={tag} size="sm">
                      {tag}
                    </EntityChip>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {metadata && (
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                data-testid="personalization-reasoning-button"
                onClick={() => setReasoningOpen(true)}
              >
                <AnalyzeIcon className="size-3.5" />
                View reasoning
              </Button>
            )}
            <Button
              variant="outlined-gray"
              size="sm"
              className="w-full"
              onClick={() => openClip(openClipPayload(clip))}
            >
              Watch clip
              <ArrowBoxRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </article>

      {reasoningOpen && metadata && (
        <PersonalizationReasoningModal
          clip={clip}
          metadata={metadata}
          onClose={() => setReasoningOpen(false)}
        />
      )}
    </>
  );
}
