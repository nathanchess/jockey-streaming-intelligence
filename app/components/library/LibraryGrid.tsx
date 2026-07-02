"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  AnalyzeIcon,
  Button,
  EntityChip,
  ExclamationIcon,
  PlayBoxedIcon,
  ToggleButton,
  ToggleButtons,
  cn,
} from "@twelvelabs-io/react";
import type { DemoAsset } from "@/lib/types";
import { computeLibraryValue } from "@/lib/library-value";
import { formatDisplayTags } from "@/lib/display-tags";
import { episodeDisplayLabel, messyAssetDisplayName } from "@/lib/library-display";
import { resolvePlaybackUrl } from "@/lib/playback";
import { LibraryStatsBar } from "@/components/library/LibraryStatsBar";
import { MetadataDataPanel } from "@/components/library/MetadataDataPanel";
import { MetadataModal } from "@/components/library/MetadataModal";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { usePlayerStore } from "@/store/player-store";

type Props = {
  assets: DemoAsset[];
  hydrated: boolean;
  onHydratedChange: (v: boolean) => void;
};

export function LibraryGrid({ assets, hydrated, onHydratedChange }: Props) {
  const [metadataAsset, setMetadataAsset] = useState<DemoAsset | null>(null);
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
  const [dataViewOpen, setDataViewOpen] = useState(false);
  const value = useMemo(() => computeLibraryValue(assets), [assets]);

  const openMetadata = (asset: DemoAsset) => {
    if (!asset.jockey_v2) return;
    setSpotlightId(asset.id);
    window.setTimeout(() => setMetadataAsset(asset), 180);
  };

  const closeMetadata = () => {
    setMetadataAsset(null);
    setSpotlightId(null);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <ToggleButtons
          value={hydrated ? "after" : "before"}
          onValueChange={(v) => {
            const nextHydrated = v === "after";
            if (!nextHydrated) setDataViewOpen(false);
            onHydratedChange(nextHydrated);
          }}
          gap
        >
          <ToggleButton value="before">Before Jockey</ToggleButton>
          <ToggleButton value="after" data-testid="hydration-toggle-after">
            After Jockey
          </ToggleButton>
        </ToggleButtons>
        <LibraryStatsBar
          value={value}
          assets={assets}
          hydrated={hydrated}
          dataViewOpen={dataViewOpen}
          onToggleDataView={() => setDataViewOpen((open) => !open)}
        />
      </div>

      <MetadataDataPanel assets={assets} open={dataViewOpen && hydrated} />

      <div
        className={cn(
          "grid auto-rows-fr gap-4 transition-all duration-300 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          spotlightId && "library-spotlight-active",
        )}
      >
        {assets.map((asset, i) => (
          <RevealOnScroll key={asset.id} staggerIndex={i} className="h-full">
            <AssetCard
              asset={asset}
              hydrated={hydrated}
              staggerIndex={i}
              spotlight={spotlightId === asset.id}
              dimmed={Boolean(spotlightId && spotlightId !== asset.id)}
              onViewMetadata={() => openMetadata(asset)}
            />
          </RevealOnScroll>
        ))}
      </div>

      {metadataAsset?.jockey_v2 && (
        <MetadataModal asset={metadataAsset} onClose={closeMetadata} />
      )}
    </div>
  );
}

function AssetCard({
  asset,
  hydrated,
  staggerIndex,
  spotlight,
  dimmed,
  onViewMetadata,
}: {
  asset: DemoAsset;
  hydrated: boolean;
  staggerIndex: number;
  spotlight: boolean;
  dimmed: boolean;
  onViewMetadata: () => void;
}) {
  const openClip = usePlayerStore((s) => s.openClip);
  const v2 = asset.jockey_v2;
  const videoSrc = resolvePlaybackUrl(asset.id, asset.playback_url);
  const hasV2 = hydrated && Boolean(v2);

  const watchEpisode = () =>
    openClip({
      videoSrc,
      startSec: 0,
      endSec: asset.duration_sec,
      title: asset.youtube_metadata.original_title,
      posterUrl: asset.thumbnail_url,
    });

  const chips = v2
    ? formatDisplayTags(v2.tags)
        .slice(0, 3)
        .map((t) => ({ label: t, key: t }))
    : [];

  const beforeTitle = messyAssetDisplayName(asset);
  const afterTitle = v2?.asset_title;

  const cardTitle = hasV2 && afterTitle ? afterTitle : beforeTitle;

  return (
    <article
      role="button"
      tabIndex={dimmed ? -1 : 0}
      aria-label={`Watch episode: ${cardTitle}`}
      onClick={dimmed ? undefined : watchEpisode}
      onKeyDown={(e) => {
        if (dimmed) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          watchEpisode();
        }
      }}
      className={cn(
        "group card-hover flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-border-secondary bg-surface-white transition-all duration-300",
        !hydrated && "opacity-90",
        hydrated && !hasV2 && "opacity-80",
        spotlight && "library-card-spotlight z-20",
        dimmed && "library-card-dimmed pointer-events-none",
      )}
      style={spotlight ? { animationDelay: `${staggerIndex * 40}ms` } : undefined}
    >
      <div className="relative aspect-video shrink-0 overflow-hidden bg-surface-muted">
        <Image
          src={asset.thumbnail_url}
          alt={beforeTitle}
          fill
          className={cn(
            "object-cover transition-transform duration-300 motion-safe:group-hover:scale-105",
            !hydrated && "grayscale-[30%]",
            hydrated && !hasV2 && "grayscale-[20%]",
          )}
          sizes="(max-width:768px) 100vw, 25vw"
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors motion-safe:group-hover:bg-black/20">
          <PlayBoxedIcon className="size-10 text-white opacity-0 transition-opacity motion-safe:group-hover:opacity-100" />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex-1">
          {hasV2 && afterTitle ? (
            <h3 className="line-clamp-3 text-sm font-medium leading-snug">
              <span className="text-foreground-subtle">{episodeDisplayLabel(asset)} · </span>
              {afterTitle}
            </h3>
          ) : (
            <h3 className="line-clamp-2 font-tl-mono text-sm font-medium text-foreground-secondary">
              {beforeTitle}
            </h3>
          )}

          {hasV2 && chips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {chips.map((c, ci) => (
                <EntityChip
                  key={c.key}
                  className="chip-stagger"
                  style={{ animationDelay: `${staggerIndex * 40 + ci * 30}ms` }}
                >
                  {c.label}
                </EntityChip>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant="outlined-gray"
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              watchEpisode();
            }}
          >
            <PlayBoxedIcon className="size-3.5" />
            Watch episode
          </Button>
          {hydrated && hasV2 && (
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              data-testid="view-metadata-button"
              onClick={(e) => {
                e.stopPropagation();
                onViewMetadata();
              }}
            >
              <AnalyzeIcon className="size-3.5" />
              View metadata
            </Button>
          )}
          {hydrated && !hasV2 && (
            <div
              data-testid="not-analyzed-placeholder"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-secondary bg-surface-muted px-3 py-2 text-xs text-foreground-subtle"
            >
              <ExclamationIcon className="size-3.5 shrink-0 text-foreground-subtle" />
              Jockey has not analyzed
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
