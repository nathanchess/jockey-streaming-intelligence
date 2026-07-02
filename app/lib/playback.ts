import type { DemoManifest, ResolvedClip } from "./types";

/** Resolve clip playback: Vercel Blob URL or local /api/media MP4. */

export const YOUTUBE_SRC_PREFIX = "youtube:";

/** YouTube playback is opt-in only (NEXT_PUBLIC_YOUTUBE_PLAYBACK=true). */
export function shouldUseYoutubeFallback(): boolean {
  return process.env.NEXT_PUBLIC_YOUTUBE_PLAYBACK === "true";
}

export function isYouTubePlaybackSrc(src: string): boolean {
  return src.startsWith(YOUTUBE_SRC_PREFIX);
}

export function youtubeIdFromPlaybackSrc(src: string): string {
  return src.slice(YOUTUBE_SRC_PREFIX.length);
}

export function resolvePlaybackUrl(
  assetId: string,
  playbackUrl?: string | null,
  youtubeId?: string,
): string {
  if (playbackUrl) return playbackUrl;
  if (youtubeId && shouldUseYoutubeFallback()) {
    return `${YOUTUBE_SRC_PREFIX}${youtubeId}`;
  }
  return `/api/media/${assetId}`;
}

/** Re-resolve cached clip URLs from manifest (e.g. Vercel Blob playback_url). */
export function remapClipsPlaybackUrls(
  clips: ResolvedClip[],
  manifest: DemoManifest,
): ResolvedClip[] {
  return clips.map((clip) => remapClipPlaybackUrl(clip, manifest));
}

export function remapClipPlaybackUrl(
  clip: ResolvedClip,
  manifest: DemoManifest,
): ResolvedClip {
  const asset = manifest.assets[clip.assetId];
  if (!asset) return clip;

  const videoSrc = resolvePlaybackUrl(
    asset.id,
    asset.playback_url,
    asset.youtube_metadata.youtube_id,
  );
  if (videoSrc === clip.videoSrc) return clip;
  return { ...clip, videoSrc, youtubeId: asset.youtube_metadata.youtube_id };
}
