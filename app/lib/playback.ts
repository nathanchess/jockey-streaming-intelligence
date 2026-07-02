import type { DemoManifest, ResolvedClip } from "./types";

/** Resolve clip playback: Vercel Blob URL, local /api/media MP4, or YouTube fallback. */

export const YOUTUBE_SRC_PREFIX = "youtube:";

/** Use YouTube embeds on Vercel/production unless explicitly disabled (local MP4 via /api/media). */
export function shouldUseYoutubeFallback(): boolean {
  if (process.env.NEXT_PUBLIC_YOUTUBE_PLAYBACK === "true") return true;
  if (process.env.NEXT_PUBLIC_YOUTUBE_PLAYBACK === "false") return false;
  if (process.env.VERCEL === "1") return true;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") return true;
  }
  return false;
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

/** Re-resolve cached clip URLs for the current runtime (Vercel → YouTube, local → /api/media). */
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

/** Client-safe normalization when API payloads still carry /api/media paths. */
export function normalizeClipVideoSrc(clip: ResolvedClip): string {
  if (isYouTubePlaybackSrc(clip.videoSrc)) return clip.videoSrc;
  if (clip.videoSrc.startsWith("http") && !clip.videoSrc.includes("/api/media")) {
    return clip.videoSrc;
  }
  return resolvePlaybackUrl(clip.assetId, null, clip.youtubeId);
}
