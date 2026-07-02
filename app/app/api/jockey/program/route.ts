import { NextRequest, NextResponse } from "next/server";
import {
  buildJockeyBody,
  callJockeyResponses,
  hasApiKey,
} from "@/lib/jockey/client";
import { finalizeProgramPayload } from "@/lib/jockey/apply-program-payload";
import { INSTRUCTIONS } from "@/lib/jockey/instructions";
import { loadDemoManifest } from "@/lib/manifest";
import { PROGRAMMING_SCHEMA } from "@/lib/jockey/schemas";
import { isStoreKey, type ProgramCachePayload } from "@/lib/types";

export async function POST(request: NextRequest) {
  if (!hasApiKey()) {
    return NextResponse.json(
      { error: "TL_API_KEY not configured", source: "live" },
      { status: 503 },
    );
  }
  const body = await request.json();
  const { storeKey, brief } = body as { storeKey: string; brief: string };
  if (!isStoreKey(storeKey) || !brief?.trim()) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    const jockeyBody = buildJockeyBody({
      storeKey,
      instructions: INSTRUCTIONS.program,
      userContent: brief,
      schemaName: "fast_programming",
      schema: PROGRAMMING_SCHEMA,
    });
    const { data, parsed, request: req } = await callJockeyResponses(jockeyBody);
    const manifest = loadDemoManifest();
    const payload = finalizeProgramPayload(
      {
        request: req,
        response: parsed as ProgramCachePayload["response"],
        resolved_clips: [],
      },
      brief,
      manifest,
      storeKey,
    );
    return NextResponse.json({
      source: "live" as const,
      endpoint: "POST /v1.3/responses",
      session_id: data.session_id,
      request: payload.request,
      response: payload.response,
      resolved_clips: payload.resolved_clips,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Jockey error", source: "live" },
      { status: 502 },
    );
  }
}
