import type { ResolvedClip } from "./types";
import { formatTimestamp } from "./types";

export function clipDisplayTitle(clip: ResolvedClip): string {
  return clip.sceneTitle ?? clip.title;
}

export function clipMatchScore(clip: ResolvedClip): string | undefined {
  return clip.matchScore ?? clip.relevanceScore;
}

export function clipLocationLine(clip: ResolvedClip): string {
  const episode = clip.episodeLabel ?? clip.assetId;
  const start = formatTimestamp(clip.startSec);
  const end = formatTimestamp(clip.endSec);
  return `${episode} · ${start} – ${end}`;
}
