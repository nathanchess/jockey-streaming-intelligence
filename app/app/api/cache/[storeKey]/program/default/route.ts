import { NextResponse } from "next/server";
import { finalizeProgramPayload } from "@/lib/jockey/apply-program-payload";
import { loadCacheManifest, loadCacheFile } from "@/lib/jockey/load-cache";
import { loadDemoManifest } from "@/lib/manifest";
import type { ProgramCachePayload } from "@/lib/types";
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
    const program = index.stores[storeKey]?.program?.default;
    if (!program) {
      return NextResponse.json({ error: "No default program" }, { status: 404 });
    }
    const payload = loadCacheFile<ProgramCachePayload>(program.file);
    const manifest = loadDemoManifest();
    const finalized = finalizeProgramPayload(payload, program.brief, manifest, storeKey);
    return NextResponse.json({
      source: "cache" as const,
      endpoint: "GET /api/cache/program/default",
      brief: program.brief,
      request: finalized.request,
      response: finalized.response,
      resolved_clips: finalized.resolved_clips,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cache miss" },
      { status: 500 },
    );
  }
}
