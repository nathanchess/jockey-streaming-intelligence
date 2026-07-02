import { NextResponse } from "next/server";
import { loadCacheManifest, loadCacheFile } from "@/lib/jockey/load-cache";
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
    const index = loadCacheManifest();
    const hydration = index.stores[storeKey]?.hydration;
    if (!hydration?.file) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const payload = loadCacheFile<{
      request: Record<string, unknown>;
      response: { assets: unknown[] };
    }>(hydration.file);
    return NextResponse.json({
      source: "cache" as const,
      endpoint: "GET /api/cache/hydration",
      request: payload.request,
      response: payload.response,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cache miss" },
      { status: 500 },
    );
  }
}
