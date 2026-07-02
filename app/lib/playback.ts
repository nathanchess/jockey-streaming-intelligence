/** Resolve MP4 playback URL: CDN manifest URL or local API route. */
export function resolvePlaybackUrl(
  assetId: string,
  playbackUrl?: string | null,
): string {
  if (playbackUrl) return playbackUrl;
  return `/api/media/${assetId}`;
}
