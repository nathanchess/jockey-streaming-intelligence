import { readFileSync, existsSync } from "fs";
import path from "path";
import type {
  DemoAsset,
  JockeyV2Hydration,
  SeriesCastMember,
  StoreKey,
} from "./types";

const V2_DIR = path.join(process.cwd(), "data", "jockey-v2");

export function loadJockeyV2Episode(
  storeKey: string,
  assetId: string,
): JockeyV2Hydration | null {
  const file = path.join(V2_DIR, "hydration", storeKey, `${assetId}.json`);
  if (!existsSync(file)) return null;
  const raw = JSON.parse(readFileSync(file, "utf-8")) as Record<string, unknown>;
  const { asset_id: _id, _meta, ...rest } = raw;
  return rest as JockeyV2Hydration;
}

export function loadJockeyV2Cast(storeKey: string): SeriesCastMember[] | null {
  const file = path.join(V2_DIR, "cast", `${storeKey}.json`);
  if (!existsSync(file)) return null;
  const data = JSON.parse(readFileSync(file, "utf-8")) as { cast_list?: SeriesCastMember[] };
  return data.cast_list ?? null;
}

export function enrichAssetsWithJockeyV2(assets: DemoAsset[]): DemoAsset[] {
  if (assets.length === 0) return assets;
  const storeKey = assets[0].store_key;
  const seriesCast = loadJockeyV2Cast(storeKey);
  return assets.map((asset) => ({
    ...asset,
    jockey_v2: loadJockeyV2Episode(storeKey, asset.id),
    series_cast: seriesCast,
  }));
}

export function countV2Analyzed(assets: DemoAsset[]): number {
  return assets.filter((a) => a.jockey_v2).length;
}

export function hasV2Store(storeKey: StoreKey): boolean {
  return existsSync(path.join(V2_DIR, "cast", `${storeKey}.json`));
}
