import { NextResponse } from "next/server";
import { loadCacheManifest, loadCacheFile } from "@/lib/jockey/load-cache";
import { loadDemoManifest } from "@/lib/manifest";
import { remapClipsPlaybackUrls } from "@/lib/playback";
import type { DiscoverCachePayload } from "@/lib/types";
import { isStoreKey } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeKey: string; profileId: string }> },
) {
  const { storeKey, profileId } = await params;
  if (!isStoreKey(storeKey)) {
    return NextResponse.json({ error: "Unknown store" }, { status: 404 });
  }
  try {
    const index = loadCacheManifest();
    const profile = index.stores[storeKey]?.discover?.[profileId];
    if (!profile) {
      return NextResponse.json({ error: "Unknown profile" }, { status: 404 });
    }
    const payload = loadCacheFile<DiscoverCachePayload>(profile.file);
    const manifest = loadDemoManifest();
    return NextResponse.json({
      source: "cache" as const,
      endpoint: "GET /api/cache/discover",
      profileId,
      intent: profile.intent,
      label: profile.label,
      request: payload.request,
      response: payload.response,
      resolved_clips: remapClipsPlaybackUrls(payload.resolved_clips, manifest),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cache miss" },
      { status: 500 },
    );
  }
}
