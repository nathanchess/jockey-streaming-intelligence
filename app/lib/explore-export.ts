import { clipDisplayTitle, clipMatchScore } from "./explore-display";
import type { ApiExchange, ResolvedClip, StoreKey } from "./types";
import { formatTimestamp } from "./types";

export type ExploreClipExportRow = {
  id: string;
  scene_title: string;
  episode: string;
  timestamp_start: string;
  timestamp_end: string;
  match_score?: string;
  match_type?: string;
  tags: string[];
  scene_description?: string;
};

export function buildExploreClipRows(clips: ResolvedClip[]): ExploreClipExportRow[] {
  return clips.map((clip) => ({
    id: clip.id,
    scene_title: clipDisplayTitle(clip),
    episode: clip.episodeLabel ?? clip.assetId,
    timestamp_start: formatTimestamp(clip.startSec),
    timestamp_end: formatTimestamp(clip.endSec),
    match_score: clipMatchScore(clip),
    match_type: clip.matchType,
    tags: clip.tags ?? clip.matchSignals ?? [],
    scene_description: clip.sceneDescription ?? clip.description,
  }));
}

export function buildExploreExportPayload(opts: {
  storeKey: StoreKey;
  mode: "browse" | "search";
  query: string;
  presetId: string | null;
  interpretation: string;
  clips: ResolvedClip[];
  exchange: ApiExchange | null;
}) {
  return {
    exported_at: new Date().toISOString(),
    store_key: opts.storeKey,
    mode: opts.mode,
    query: opts.query || null,
    preset_id: opts.presetId,
    query_interpretation: opts.interpretation || null,
    clip_count: opts.clips.length,
    clips: buildExploreClipRows(opts.clips),
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

export function downloadExploreJson(
  opts: Parameters<typeof buildExploreExportPayload>[0],
  filename?: string,
) {
  const payload = buildExploreExportPayload(opts);
  const name =
    filename ??
    `${opts.storeKey}-explore-${opts.mode}${opts.presetId ? `-${opts.presetId}` : ""}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
