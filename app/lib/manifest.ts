import { readFileSync, existsSync } from "fs";
import path from "path";
import type { DemoManifest } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

export function getManifestPath(): string {
  return path.join(DATA_DIR, "demo-manifest.json");
}

export function loadDemoManifest(): DemoManifest {
  const filePath = getManifestPath();
  if (!existsSync(filePath)) {
    throw new Error(`Missing ${filePath}. Run npm run sync-manifest`);
  }
  return JSON.parse(readFileSync(filePath, "utf-8")) as DemoManifest;
}

export function getStoreSlice(manifest: DemoManifest, storeKey: string) {
  const store = manifest.stores[storeKey];
  if (!store) return null;
  const assets = store.asset_ids
    .map((id) => manifest.assets[id])
    .filter(Boolean);
  return { store, assets };
}
