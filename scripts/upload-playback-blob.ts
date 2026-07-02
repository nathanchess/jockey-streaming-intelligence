/**
 * Upload local MP4s to Vercel Blob and write playback_url into demo-manifest.json.
 *
 * Requires: BLOB_READ_WRITE_TOKEN in app/.env.local (or env)
 * Run from app/: npm run upload-playback
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "app", "data", "demo-manifest.json");
const VIDEO_ROOT = path.join(ROOT, "preprocessing", "videos");
const ENV_LOCAL = path.join(ROOT, "app", ".env.local");

function loadEnvLocal(): void {
  if (!existsSync(ENV_LOCAL)) return;
  for (const line of readFileSync(ENV_LOCAL, "utf-8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function videoFileName(localPath?: string, assetId?: string): string {
  if (!localPath) return `${assetId ?? "unknown"}.mp4`;
  return localPath.replace(/^videos[/\\]/i, "").replace(/\\/g, "/");
}

async function main() {
  loadEnvLocal();
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error("Set BLOB_READ_WRITE_TOKEN to upload videos to Vercel Blob.");
    process.exit(1);
  }
  if (!existsSync(MANIFEST_PATH)) {
    throw new Error("Run sync-manifest first");
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8")) as {
    assets: Record<string, { id: string; processing?: { local_path?: string }; playback_url?: string }>;
  };

  for (const asset of Object.values(manifest.assets)) {
    const rel = videoFileName(asset.processing?.local_path, asset.id);
    const filePath = path.join(VIDEO_ROOT, rel);
    if (!existsSync(filePath)) {
      console.warn(`Skip ${asset.id}: missing ${filePath}`);
      continue;
    }

    const file = readFileSync(filePath);
    const res = await fetch(`https://blob.vercel-storage.com/${asset.id}.mp4`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "video/mp4",
        "x-api-version": "7",
      },
      body: file,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Upload failed for ${asset.id}: ${res.status} ${text}`);
    }

    const data = (await res.json()) as { url: string };
    asset.playback_url = data.url;
    console.log(`Uploaded ${asset.id} → ${data.url}`);
  }

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log("Updated playback_url in demo-manifest.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
