import { NextResponse } from "next/server";
import { buildDefaultExplorePayload } from "@/lib/explore-browse";
import { loadDemoManifest } from "@/lib/manifest";
import { isStoreKey } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeKey: string }> },
) {
  const { storeKey } = await params;
  if (!isStoreKey(storeKey)) {
    return NextResponse.json({ error: "Unknown store" }, { status: 404 });
  }

  try {
    const manifest = loadDemoManifest();
    const store = manifest.stores[storeKey];
    if (!store) {
      return NextResponse.json({ error: "Unknown store" }, { status: 404 });
    }

    const payload = buildDefaultExplorePayload(manifest, storeKey, store.display_name);
    return NextResponse.json({
      source: "cache" as const,
      endpoint: "GET /api/cache/explore/default",
      mode: "browse" as const,
      request: payload.request,
      response: payload.response,
      resolved_clips: payload.resolved_clips,
      follow_ups: [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to build explore browse" },
      { status: 500 },
    );
  }
}
