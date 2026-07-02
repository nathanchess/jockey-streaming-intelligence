import { NextRequest, NextResponse } from "next/server";
import {
  buildJockeyBody,
  callJockeyResponses,
  hasApiKey,
} from "@/lib/jockey/client";
import { INSTRUCTIONS } from "@/lib/jockey/instructions";
import { loadDemoManifest } from "@/lib/manifest";
import { resolveSearchResults } from "@/lib/jockey/resolve-asset";
import { SEARCH_SCHEMA } from "@/lib/jockey/schemas";
import { isStoreKey, type SearchResultRaw } from "@/lib/types";

export async function POST(request: NextRequest) {
  if (!hasApiKey()) {
    return NextResponse.json(
      { error: "TL_API_KEY not configured", source: "live" },
      { status: 503 },
    );
  }
  const body = await request.json();
  const { storeKey, query, sessionId } = body as {
    storeKey: string;
    query: string;
    sessionId?: string;
  };
  if (!isStoreKey(storeKey) || !query?.trim()) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    const jockeyBody = buildJockeyBody({
      storeKey,
      instructions: INSTRUCTIONS.search,
      userContent: query,
      schemaName: "semantic_search",
      schema: SEARCH_SCHEMA,
      sessionId,
    });
    const { data, parsed, request: req } = await callJockeyResponses(jockeyBody);
    const manifest = loadDemoManifest();
    const response = parsed as {
      results?: SearchResultRaw[];
    };
    const resolved_clips = resolveSearchResults(
      manifest,
      storeKey,
      response.results ?? [],
    );
    return NextResponse.json({
      source: "live" as const,
      endpoint: "POST /v1.3/responses",
      session_id: data.session_id,
      request: req,
      response: parsed,
      resolved_clips,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Jockey error", source: "live" },
      { status: 502 },
    );
  }
}
