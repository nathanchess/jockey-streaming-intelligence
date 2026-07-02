import type {
  DemoAsset,
  DemoManifest,
  DiscoverRailItemRaw,
  ProgramLineupItemRaw,
  ResolvedClip,
  SearchResultRaw,
} from "../types";
import { parseTimestamp } from "../types";
import { resolvePlaybackUrl } from "../playback";
import {
  buildPersonalizationClipMetadata,
} from "../personalization-clip-metadata";
import type { PersonalizationConfig } from "../personalization-config";

export function buildEmbedUrl(youtubeId: string): string {
  const params = new URLSearchParams({
    controls: "0",
    modestbranding: "1",
    rel: "0",
    disablekb: "1",
    fs: "0",
    enablejsapi: "1",
  });
  return `https://www.youtube.com/embed/${youtubeId}?${params.toString()}`;
}

export function findAssetByReference(
  manifest: DemoManifest,
  reference: string,
  storeKey?: string,
): DemoAsset | undefined {
  const ref = reference.trim().toLowerCase().replace(/^ksi_/, "");
  if (!ref) return undefined;

  return Object.values(manifest.assets).find((asset) => {
    if (storeKey && asset.store_key !== storeKey) return false;
    const id = asset.id.toLowerCase();
    const assetId = asset.jockey?.asset_id?.toLowerCase() ?? "";
    const itemId = (asset.jockey?.item_id ?? "").trim().toLowerCase().replace(/^ksi_/, "");
    const aliasItemIds =
      asset.jockey?.alias_item_ids?.map((id) => id.trim().toLowerCase().replace(/^ksi_/, "")) ??
      [];
    const hydratedRef = asset.hydrated_metadata?.asset_reference?.toLowerCase() ?? "";
    const title = asset.messy_metadata.title.toLowerCase();
    const ytTitle = asset.youtube_metadata.original_title.toLowerCase();

    if (ref === id || ref === assetId || ref === itemId || ref === hydratedRef) return true;
    if (aliasItemIds.some((alias) => alias === ref || alias.includes(ref) || ref.includes(alias))) {
      return true;
    }
    if (itemId && (itemId.includes(ref) || ref.includes(itemId))) return true;
    if (assetId && (assetId.includes(ref) || ref.includes(assetId))) return true;
    if (id.includes(ref) || ref.includes(id)) return true;
    if (title.includes(ref) || ytTitle.includes(ref)) return true;
    return false;
  });
}

function clipFromAsset(
  asset: DemoAsset,
  start: string | number,
  end: string | number,
  title: string,
  extras: Partial<ResolvedClip> = {},
): ResolvedClip {
  return {
    id: extras.id ?? `${asset.id}-${start}`,
    assetId: asset.id,
    assetReference: asset.id,
    episodeLabel: asset.episode_label,
    videoSrc: resolvePlaybackUrl(asset.id, asset.playback_url),
    startSec: parseTimestamp(start),
    endSec: parseTimestamp(end),
    thumbnailUrl: asset.thumbnail_url,
    title: title || asset.youtube_metadata.original_title,
    ...extras,
  };
}

export function resolveClip(
  manifest: DemoManifest,
  assetReference: string,
  start: string | number,
  end: string | number,
  title: string,
  extras: Partial<ResolvedClip> = {},
  storeKey?: string,
): ResolvedClip | null {
  const asset = findAssetByReference(manifest, assetReference, storeKey);
  if (!asset) return null;
  return clipFromAsset(asset, start, end, title, {
    ...extras,
    assetReference,
  });
}

export function resolveSearchResults(
  manifest: DemoManifest,
  storeKey: string,
  results: SearchResultRaw[],
): ResolvedClip[] {
  return results
    .map((r, i) => {
      const sceneTitle = r.scene_title || r.description.slice(0, 80);
      return resolveClip(
        manifest,
        r.asset_reference,
        r.timestamp_start,
        r.timestamp_end,
        sceneTitle,
        {
          id: `result-${i}`,
          sceneTitle,
          description: r.description,
          matchType: r.match_type,
          relevanceScore: r.relevance_score,
          matchScore: r.relevance_score,
          sceneDescription: r.scene_description,
          alignmentReasoning: r.alignment_reasoning,
          matchSignals: r.match_signals,
          tags: r.tags,
          charactersPresent: r.characters_present,
        },
        storeKey,
      );
    })
    .filter((c): c is ResolvedClip => c !== null);
}

export function resolveDiscoverRail(
  manifest: DemoManifest,
  storeKey: string,
  rail: DiscoverRailItemRaw[],
  config?: PersonalizationConfig,
): ResolvedClip[] {
  const clips: ResolvedClip[] = [];
  for (const r of rail) {
    const clip = resolveClip(manifest, r.asset_reference, r.clip_start, r.clip_end, r.title, {
      id: `${storeKey}-discover-${r.rank}`,
      description: r.clip_description ?? r.rationale,
      sceneDescription: r.clip_description,
      matchSignals: r.match_signals,
      audienceAlignmentReasoning: r.audience_alignment_reasoning,
      clipLabel: r.clip_label ?? r.title,
      subClipFocus: r.sub_clip_focus,
      charactersPresent: r.characters_present,
      rank: r.rank,
    }, storeKey);
    if (!clip) continue;
    clips.push({
      ...clip,
      personalizationMetadata: config
        ? buildPersonalizationClipMetadata(clip, config, r)
        : clip.personalizationMetadata,
    });
  }
  return clips;
}

export function resolveProgramLineup(
  manifest: DemoManifest,
  storeKey: string,
  lineup: ProgramLineupItemRaw[],
): ResolvedClip[] {
  return lineup
    .map((row) =>
      resolveClip(
        manifest,
        row.asset_reference,
        row.clip_start,
        row.clip_end,
        row.title,
        {
          id: `lineup-${row.position}`,
          description: row.programming_rationale,
        },
        storeKey,
      ),
    )
    .filter((c): c is ResolvedClip => c !== null);
}
