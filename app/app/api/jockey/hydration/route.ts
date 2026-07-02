import { NextRequest, NextResponse } from "next/server";
import {
  buildJockeyBody,
  callJockeyResponses,
  hasApiKey,
} from "@/lib/jockey/client";
import { INSTRUCTIONS } from "@/lib/jockey/instructions";
import { HYDRATION_SCHEMA } from "@/lib/jockey/schemas";
import { isStoreKey } from "@/lib/types";

export async function POST(request: NextRequest) {
  if (!hasApiKey()) {
    return NextResponse.json(
      { error: "TL_API_KEY not configured", source: "live" },
      { status: 503 },
    );
  }
  const body = await request.json();
  const { storeKey } = body as { storeKey: string };
  if (!isStoreKey(storeKey)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    const jockeyBody = buildJockeyBody({
      storeKey,
      instructions: INSTRUCTIONS.hydration,
      userContent: `Hydrate all assets in the ${storeKey} knowledge store with rich metadata.`,
      schemaName: "metadata_hydration",
      schema: HYDRATION_SCHEMA,
    });
    const { data, parsed, request: req } = await callJockeyResponses(jockeyBody);
    return NextResponse.json({
      source: "live" as const,
      endpoint: "POST /v1.3/responses",
      session_id: data.session_id,
      request: req,
      response: parsed,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Jockey error", source: "live" },
      { status: 502 },
    );
  }
}
