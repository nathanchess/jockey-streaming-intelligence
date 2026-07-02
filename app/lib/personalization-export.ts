import type { ApiExchange, ResolvedClip, StoreKey, ViewerProfileId } from "./types";
import { formatTimestamp } from "./types";
import type { PersonalizationConfig } from "./personalization-config";

export type PersonalizationClipExportRow = {
  id: string;
  rank?: number;
  title: string;
  episode: string;
  timestamp_start: string;
  timestamp_end: string;
  matched_interests: string[];
  avoided_themes: string[];
  character_spotlight: string[];
  clip_length_min: number;
  audience_fit: number;
};

export function buildPersonalizationClipRows(clips: ResolvedClip[]): PersonalizationClipExportRow[] {
  return clips.map((clip) => ({
    id: clip.id,
    rank: clip.rank,
    title: clip.title,
    episode: clip.episodeLabel ?? clip.assetId,
    timestamp_start: formatTimestamp(clip.startSec),
    timestamp_end: formatTimestamp(clip.endSec),
    matched_interests: clip.personalizationMetadata?.matchedAudienceInterests ?? [],
    avoided_themes: clip.personalizationMetadata?.avoidedThemes ?? [],
    character_spotlight: clip.personalizationMetadata?.characterSpotlight ?? [],
    clip_length_min: clip.personalizationMetadata?.clipLengthMin ?? 0,
    audience_fit: clip.personalizationMetadata?.fitScores.audienceFit ?? 0,
  }));
}

export function buildPersonalizationExportPayload(opts: {
  storeKey: StoreKey;
  profileId: ViewerProfileId;
  config: PersonalizationConfig;
  clips: ResolvedClip[];
  exchange: ApiExchange | null;
  source: "cache" | "live";
}) {
  return {
    exported_at: new Date().toISOString(),
    store_key: opts.storeKey,
    profile_id: opts.profileId,
    source: opts.source,
    audience_config: opts.config,
    clip_count: opts.clips.length,
    clips: buildPersonalizationClipRows(opts.clips),
    api: opts.exchange
      ? {
          endpoint: opts.exchange.endpoint,
          source: opts.exchange.source,
          request: opts.exchange.request,
          response: opts.exchange.response,
          session_id: opts.exchange.session_id,
        }
      : null,
  };
}

export function downloadPersonalizationJson(
  payload: ReturnType<typeof buildPersonalizationExportPayload>,
  filename: string,
) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
