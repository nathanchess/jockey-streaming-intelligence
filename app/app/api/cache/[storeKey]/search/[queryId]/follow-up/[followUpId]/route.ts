import { NextResponse } from "next/server";
import { loadCacheManifest, loadCacheFile } from "@/lib/jockey/load-cache";
import type { SearchCachePayload } from "@/lib/types";
import { isStoreKey } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeKey: string; queryId: string; followUpId: string }> },
) {
  const { storeKey, queryId, followUpId } = await params;
  if (!isStoreKey(storeKey)) {
    return NextResponse.json({ error: "Unknown store" }, { status: 404 });
  }
  try {
    const index = loadCacheManifest();
    const preset = index.stores[storeKey]?.search?.presets.find((p) => p.id === queryId);
    const followUp = preset?.follow_ups?.find((f) => f.id === followUpId);
    if (!followUp) {
      return NextResponse.json({ error: "Unknown follow-up" }, { status: 404 });
    }
    const payload = loadCacheFile<SearchCachePayload>(followUp.file);
    return NextResponse.json({
      source: "cache" as const,
      endpoint: "GET /api/cache/search/follow-up",
      queryId,
      followUpId,
      session_id: payload.session_id ?? followUp.session_id,
      request: payload.request,
      response: payload.response,
      resolved_clips: payload.resolved_clips,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cache miss" },
      { status: 500 },
    );
  }
}
