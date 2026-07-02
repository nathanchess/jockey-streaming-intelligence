"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import {
  CloseIcon,
  EntityChip,
  IconButton,
} from "@twelvelabs-io/react";
import type { ResolvedClip } from "@/lib/types";
import { clipLocationLine } from "@/lib/explore-display";
import type { PersonalizationClipMetadata } from "@/lib/personalization-clip-metadata";
import { MetadataSection } from "@/components/library/MetadataSection";
import { MatchSignalsChips } from "@/components/jockey/ReasoningPanel";

function FitScoreBar({
  label,
  subtitle,
  value,
}: {
  label: string;
  subtitle?: string;
  value: number;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground-body">{label}</p>
          {subtitle && <p className="text-xs text-foreground-subtle">{subtitle}</p>}
        </div>
        <span className="font-tl-mono text-sm text-foreground-status-success">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-foreground-status-success transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

function MetadataBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border-secondary bg-surface-muted/40 p-4">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-foreground-subtle">
        {title}
      </p>
      {children}
    </div>
  );
}

export function PersonalizationReasoningModal({
  clip,
  metadata,
  onClose,
}: {
  clip: ResolvedClip;
  metadata: PersonalizationClipMetadata;
  onClose: () => void;
}) {
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

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex h-dvh overflow-hidden">
      <button
        type="button"
        className="metadata-backdrop-enter min-w-0 flex-1 bg-black/45"
        aria-label="Close personalization reasoning"
        onClick={onClose}
      />
      <div
        data-testid="personalization-reasoning-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="personalization-reasoning-title"
        className="metadata-drawer-enter relative z-10 flex h-dvh w-full flex-col overflow-hidden border-l border-border-secondary bg-surface-white shadow-2xl sm:w-[min(56vw,720px)] sm:min-w-[420px] sm:shrink-0"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border-secondary px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs text-foreground-subtle">Personalization reasoning</p>
            <h2 id="personalization-reasoning-title" className="text-lg font-normal leading-snug">
              {clip.title}
            </h2>
            <p className="mt-1 font-tl-mono text-xs text-foreground-subtle">{clipLocationLine(clip)}</p>
          </div>
          <IconButton variant="outlined-gray" size="regular" aria-label="Close" onClick={onClose}>
            <CloseIcon className="size-4" />
          </IconButton>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-5">
          <MetadataSection title="Audience fit scores">
            <div className="space-y-4">
              <FitScoreBar
                label="Audience fit"
                subtitle="Overall alignment with the configured profile"
                value={metadata.fitScores.audienceFit}
              />
              <FitScoreBar
                label="Interest match"
                subtitle="Overlap with Looking for signals"
                value={metadata.fitScores.interestMatch}
              />
              <FitScoreBar
                label="Avoidance confidence"
                subtitle="Confidence that negative targeting was honored"
                value={metadata.fitScores.avoidanceConfidence}
              />
            </div>
          </MetadataSection>

          <MetadataSection title="About this clip">
            <MetadataBlock title="What happens">
              <p className="text-sm leading-relaxed text-foreground-secondary">
                {metadata.clipDescription || clip.sceneDescription || clip.description || clip.subClipFocus}
              </p>
            </MetadataBlock>
          </MetadataSection>

          <MetadataSection title="Reasoning">
            <MetadataBlock title="Why this fits your profile">
              <p className="text-sm leading-relaxed text-foreground-secondary">{metadata.reasoning}</p>
            </MetadataBlock>
          </MetadataSection>

          <MetadataSection title="Clip metadata">
            <div className="grid gap-3">
              <MetadataBlock title="Matched audience interest">
                <MatchSignalsChips signals={metadata.matchedAudienceInterests} />
              </MetadataBlock>
              <MetadataBlock title="Clip length">
                <p className="font-tl-mono text-sm text-foreground-body">
                  {metadata.clipLengthMin} min window
                </p>
                <p className="mt-1 text-xs text-foreground-subtle">
                  Within your configured max clip length target
                </p>
              </MetadataBlock>
              <MetadataBlock title="What it avoided">
                <MatchSignalsChips signals={metadata.avoidedThemes} />
              </MetadataBlock>
              <MetadataBlock title="Character spotlight">
                <div className="flex flex-wrap gap-2">
                  {metadata.characterSpotlight.map((name) => (
                    <EntityChip key={name} size="sm">
                      {name}
                    </EntityChip>
                  ))}
                </div>
              </MetadataBlock>
            </div>
          </MetadataSection>
        </div>
      </div>
    </div>,
    document.body,
  );
}
