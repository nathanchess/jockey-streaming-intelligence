import type { DemoAsset } from "./types";

/** Thin-catalog label: raw mp4 filename or asset id (Before Jockey). */
export function messyAssetDisplayName(asset: DemoAsset): string {
  const path = asset.processing?.local_path;
  if (path) {
    const parts = path.split(/[/\\]/);
    return parts[parts.length - 1] ?? `${asset.id}.mp4`;
  }
  return `${asset.id}.mp4`;
}

/** Episode prefix for hydrated cards, e.g. "Ep 1". */
export function episodeDisplayLabel(asset: DemoAsset): string {
  return asset.episode_label;
}
