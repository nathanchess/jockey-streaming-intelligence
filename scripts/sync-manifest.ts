import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SNAPSHOT = path.join(ROOT, "preprocessing", "output", "jockey-snapshot.json");
const OUT_DIR = path.join(ROOT, "app", "data");
const OUT_FILE = path.join(OUT_DIR, "demo-manifest.json");
const PLAYBACK_URLS_FILE = path.join(OUT_DIR, "playback-urls.json");
const PREPROCESSING_ENV = path.join(ROOT, "preprocessing", ".env");
const APP_ENV = path.join(ROOT, "app", ".env.local");

function buildEmbedUrl(youtubeId: string): string {
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

function loadEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(filePath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return out;
}

function loadTelemetryItemAliases(): Record<string, Set<string>> {
  const aliases: Record<string, Set<string>> = {};
  const telemetryDir = path.join(ROOT, "preprocessing", "output", "telemetry");
  if (!existsSync(telemetryDir)) return aliases;

  for (const file of readdirSync(telemetryDir)) {
    if (!file.endsWith(".jsonl")) continue;
    for (const line of readFileSync(path.join(telemetryDir, file), "utf-8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const event = JSON.parse(trimmed) as {
          event?: string;
          asset_id?: string;
          item_id?: string;
        };
        if (event.event !== "item_create_ok" || !event.asset_id || !event.item_id) continue;
        aliases[event.asset_id] ??= new Set<string>();
        aliases[event.asset_id].add(event.item_id);
      } catch {
        // ignore malformed telemetry lines
      }
    }
  }
  return aliases;
}

function main() {
  const snapshot = JSON.parse(readFileSync(SNAPSHOT, "utf-8"));
  const env = { ...loadEnvFile(PREPROCESSING_ENV), ...loadEnvFile(APP_ENV) };

  const stores: Record<string, unknown> = {};
  const assets: Record<string, unknown> = {};

  for (const [storeKey, storeData] of Object.entries(snapshot.stores) as [
    string,
    {
      knowledge_store_id: string;
      name: string;
      display_name: string;
      vertical: string;
      assets: Array<Record<string, unknown>>;
    },
  ][]) {
    const assetIds: string[] = [];
    for (const asset of storeData.assets) {
      const id = asset.id as string;
      assetIds.push(id);
      const yt = asset.youtube_metadata as {
        youtube_id: string;
        thumbnail_url: string;
        duration_sec: number;
      };
      assets[id] = {
        ...asset,
        embed_url: buildEmbedUrl(yt.youtube_id),
        thumbnail_url: yt.thumbnail_url,
        duration_sec: yt.duration_sec,
      };
    }
    stores[storeKey] = {
      knowledge_store_id: storeData.knowledge_store_id,
      name: storeData.name,
      display_name: storeData.display_name,
      vertical: storeData.vertical,
      asset_ids: assetIds,
    };
  }

  const checkpointPath = path.join(ROOT, "preprocessing", "output", "checkpoint.json");
  if (existsSync(checkpointPath)) {
    const checkpoint = JSON.parse(readFileSync(checkpointPath, "utf-8")) as {
      assets?: Record<
        string,
        { asset_id?: string; item_id?: string; knowledge_store_id?: string; store_key?: string }
      >;
    };
    for (const [assetId, entry] of Object.entries(checkpoint.assets ?? {})) {
      const asset = assets[assetId] as { jockey?: Record<string, unknown> } | undefined;
      if (!asset?.jockey || !entry.asset_id || !entry.item_id) continue;
      asset.jockey = {
        ...asset.jockey,
        knowledge_store_id: entry.knowledge_store_id ?? asset.jockey.knowledge_store_id,
        store_key: entry.store_key ?? asset.jockey.store_key,
        asset_id: entry.asset_id,
        item_id: entry.item_id,
        asset_status: "ready",
        item_status: "ready",
      };
    }
    console.log(`Applied jockey IDs from ${checkpointPath}`);
  }

  const telemetryAliases = loadTelemetryItemAliases();
  for (const [storeKey, storeData] of Object.entries(snapshot.stores) as [
    string,
    { assets: Array<Record<string, unknown>> },
  ][]) {
    for (const snapshotAsset of storeData.assets) {
      const assetId = snapshotAsset.id as string;
      const asset = assets[assetId] as { jockey?: Record<string, unknown> } | undefined;
      if (!asset?.jockey) continue;
      const currentItemId = String(asset.jockey.item_id ?? snapshotAsset.jockey?.item_id ?? "");
      const aliasSet = new Set<string>(telemetryAliases[assetId] ?? []);
      const snapshotItemId = (snapshotAsset.jockey as { item_id?: string } | undefined)?.item_id;
      if (snapshotItemId) aliasSet.add(snapshotItemId);
      if (currentItemId) aliasSet.delete(currentItemId);
      const alias_item_ids = [...aliasSet].filter(Boolean);
      if (alias_item_ids.length > 0) {
        asset.jockey.alias_item_ids = alias_item_ids;
      }
    }
    void storeKey;
  }

  const manifest = {
    updated_at: new Date().toISOString(),
    stores,
    assets,
  };

  if (existsSync(PLAYBACK_URLS_FILE)) {
    const playbackUrls = JSON.parse(readFileSync(PLAYBACK_URLS_FILE, "utf-8")) as Record<
      string,
      string
    >;
    for (const [assetId, url] of Object.entries(playbackUrls)) {
      const asset = manifest.assets[assetId] as { playback_url?: string } | undefined;
      if (asset && url) asset.playback_url = url;
    }
    console.log(`Applied ${Object.keys(playbackUrls).length} playback URLs from ${PLAYBACK_URLS_FILE}`);
  } else if (existsSync(OUT_FILE)) {
    const existing = JSON.parse(readFileSync(OUT_FILE, "utf-8")) as {
      assets?: Record<string, { playback_url?: string }>;
    };
    for (const [assetId, asset] of Object.entries(existing.assets ?? {})) {
      if (!asset.playback_url) continue;
      const target = manifest.assets[assetId] as { playback_url?: string } | undefined;
      if (target) target.playback_url = asset.playback_url;
    }
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2));

  if (env.KNOWLEDGE_STORE_IDS && !existsSync(APP_ENV)) {
    const lines = [
      `TL_API_KEY=${env.TL_API_KEY ?? ""}`,
      `KNOWLEDGE_STORE_IDS=${env.KNOWLEDGE_STORE_IDS}`,
    ];
    writeFileSync(APP_ENV, lines.join("\n") + "\n");
    console.log(`Wrote ${APP_ENV}`);
  }

  console.log(`Synced ${Object.keys(assets).length} assets to ${OUT_FILE}`);
}

main();
