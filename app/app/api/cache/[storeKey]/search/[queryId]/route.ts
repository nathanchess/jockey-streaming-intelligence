import { NextResponse } from "next/server";
import { loadCacheManifest, loadCacheFile } from "@/lib/jockey/load-cache";
import type { SearchCachePayload } from "@/lib/types";
import { isStoreKey } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeKey: string; queryId: string }> },
) {
  const { storeKey, queryId } = await params;
  if (!isStoreKey(storeKey)) {
    return NextResponse.json({ error: "Unknown store" }, { status: 404 });
  }
  try {
    const index = loadCacheManifest();
    const store = index.stores[storeKey];
    const preset = store?.search?.presets.find((p) => p.id === queryId);
    if (!preset) {
      return NextResponse.json({ error: "Unknown query preset" }, { status: 404 });
    }
    const payload = loadCacheFile<SearchCachePayload>(preset.file);
    return NextResponse.json({
      source: "cache" as const,
      endpoint: "GET /api/cache/search",
      queryId,
      session_id: payload.session_id ?? preset.session_id,
      request: payload.request,
      response: payload.response,
      resolved_clips: payload.resolved_clips,
      explore_presentation: payload.explore_presentation,
      follow_ups: preset.follow_ups ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cache miss" },
      { status: 500 },
    );
  }
}
