"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  Button,
  CloseIcon,
  cn,
  EntityChip,
  IconButton,
  PlayBoxedIcon,
} from "@twelvelabs-io/react";
import type { DemoAsset, SeriesCastMember } from "@/lib/types";
import { formatDisplayTimestamp, parseTimestamp } from "@/lib/types";
import { resolvePlaybackUrl } from "@/lib/playback";
import { formatDisplayTags } from "@/lib/display-tags";
import { MatchSignalsChips } from "@/components/jockey/ReasoningPanel";
import { ReasoningPanel } from "@/components/jockey/ReasoningPanel";
import { MetadataSection } from "@/components/library/MetadataSection";
import { usePlayerStore } from "@/store/player-store";

type Props = {
  asset: DemoAsset;
  onClose: () => void;
};

function castForEpisode(seriesCast: SeriesCastMember[] | null | undefined, assetId: string) {
  if (!seriesCast) return [];
  const seen = new Set<string>();
  const result: SeriesCastMember[] = [];

  for (const member of seriesCast) {
    const inEpisode = (member.key_moments ?? []).some((m) => m.episode_label === assetId);
    if (!inEpisode) continue;
    const key = member.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(member);
  }

  return result;
}

export function MetadataModal({ asset, onClose }: Props) {
  const openClip = usePlayerStore((s) => s.openClip);
  const v2 = asset.jockey_v2;
  const videoSrc = resolvePlaybackUrl(asset.id, asset.playback_url);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
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
  }, [onClose]);

  if (!v2 || !mounted) return null;

  const openAt = (start: string, end: string, title: string) => {
    openClip({
      videoSrc,
      startSec: parseTimestamp(start),
      endSec: parseTimestamp(end),
      title,
      posterUrl: asset.thumbnail_url,
    });
  };

  const episodeCast = castForEpisode(asset.series_cast, asset.id);
  const summaryParagraphs = v2.episode_summary.split(/\n\n+/).filter(Boolean);

  const displayTags = formatDisplayTags(v2.tags);

  return createPortal(
    <div className="fixed inset-0 z-50 flex h-dvh overflow-hidden">
      <button
        type="button"
        className="metadata-backdrop-enter min-w-0 flex-1 bg-black/45"
        aria-label="Close metadata"
        onClick={onClose}
      />
      <div
        data-testid="metadata-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="metadata-modal-title"
        className="metadata-drawer-enter relative z-10 flex h-dvh w-full flex-col overflow-hidden border-l border-border-secondary bg-surface-white shadow-2xl sm:w-[min(56vw,720px)] sm:min-w-[420px] sm:shrink-0"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border-secondary px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs text-foreground-subtle">{asset.episode_label}</p>
            <h2 id="metadata-modal-title" className="break-words text-lg font-normal leading-snug">
              {v2.asset_title}
            </h2>
          </div>
          <IconButton variant="outlined-gray" size="regular" aria-label="Close" onClick={onClose}>
            <CloseIcon className="size-4" />
          </IconButton>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-5">
          <div className="mb-8 grid gap-6 md:grid-cols-[200px_1fr]">
            <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-muted md:aspect-auto md:min-h-[120px]">
              <Image src={asset.thumbnail_url} alt="" fill className="object-cover" sizes="200px" />
            </div>
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap gap-1">
                {displayTags.map((t) => (
                  <EntityChip key={t}>{t}</EntityChip>
                ))}
              </div>
              {v2.characters_present.length > 0 && (
                <div data-testid="characters-present">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-foreground-subtle">
                    Characters in episode
                  </p>
                  <MatchSignalsChips signals={v2.characters_present} />
                </div>
              )}
            </div>
          </div>

          <MetadataSection title="Episode summary">
            <div className="rounded-xl border border-border-secondary bg-surface-muted/40 p-4">
              <div className="space-y-3 text-sm leading-relaxed text-foreground-secondary">
                {summaryParagraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          </MetadataSection>

          <MetadataSection title="Importance in series">
            <div className="rounded-xl border border-border-secondary bg-surface-muted/40 p-4">
              <p className="text-sm leading-relaxed text-foreground-secondary">
                {v2.episode_importance_in_series}
              </p>
            </div>
          </MetadataSection>

          {episodeCast.length > 0 && (
            <MetadataSection title="Cast in this episode" testId="cast-analysis">
              <div className="grid gap-3 sm:grid-cols-2">
                {episodeCast.map((member) => (
                  <div
                    key={member.name}
                    className="min-w-0 rounded-xl border border-border-secondary bg-surface-muted/40 p-3"
                  >
                    <p className="font-medium">{member.name}</p>
                    <p className="text-xs text-foreground-subtle">{member.role}</p>
                    <p className="mt-2 text-sm text-foreground-secondary">{member.description}</p>
                  </div>
                ))}
              </div>
            </MetadataSection>
          )}

          {v2.most_important_scene && (
            <MetadataSection title="Most important scene" testId="most-important-scene">
              <ReasoningPanel title="Scene highlight">
                <p className="mb-1 font-medium">{v2.most_important_scene.title}</p>
                <p className="mb-2 font-tl-mono text-xs text-foreground-subtle">
                  {formatDisplayTimestamp(v2.most_important_scene.timestamp_start)} –{" "}
                  {formatDisplayTimestamp(v2.most_important_scene.timestamp_end)}
                </p>
                {v2.most_important_scene.characters_present && (
                  <div className="mb-2">
                    <MatchSignalsChips signals={v2.most_important_scene.characters_present} />
                  </div>
                )}
                {v2.most_important_scene.description && (
                  <p className="mb-2 text-sm leading-relaxed">{v2.most_important_scene.description}</p>
                )}
                <p className="text-sm text-foreground-secondary">
                  {v2.most_important_scene.reasoning}
                </p>
                <Button
                  variant="outlined-gray"
                  size="sm"
                  className="mt-3"
                  onClick={() =>
                    openAt(
                      v2.most_important_scene.timestamp_start,
                      v2.most_important_scene.timestamp_end,
                      v2.most_important_scene.title,
                    )
                  }
                >
                  <PlayBoxedIcon className="size-3.5" />
                  Watch scene
                </Button>
              </ReasoningPanel>
            </MetadataSection>
          )}

          {v2.episode_timeline.length > 0 && (
            <MetadataSection title="Full episode timeline" testId="episode-timeline">
              <ol className="relative space-y-0 border-l border-border-secondary pl-4">
                {v2.episode_timeline.map((beat, i) => (
                  <li key={`${beat.label}-${i}`} className="relative min-w-0 pb-6 last:pb-0">
                    <span className="absolute left-[-21px] top-1 size-2.5 rounded-full bg-foreground-body ring-4 ring-surface-white" />
                    <button
                      type="button"
                      aria-label={`Watch scene: ${beat.label}`}
                      className={cn(
                        "tl-prose-card w-full rounded-xl border border-border-secondary bg-surface-white p-3",
                        "transition-colors hover:bg-surface-muted/60",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-misc-ring/50 focus-visible:ring-offset-2",
                      )}
                      onClick={() => openAt(beat.timestamp_start, beat.timestamp_end, beat.label)}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{beat.label}</span>
                        <span className="font-tl-mono text-xs text-foreground-subtle">
                          {formatDisplayTimestamp(beat.timestamp_start)} –{" "}
                          {formatDisplayTimestamp(beat.timestamp_end)}
                        </span>
                      </div>
                      <div className="mt-2">
                        <MatchSignalsChips signals={beat.characters_present} />
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
                        {beat.description}
                      </p>
                      <p className="mt-2 text-xs text-foreground-subtle">{beat.reasoning}</p>
                    </button>
                  </li>
                ))}
              </ol>
            </MetadataSection>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
