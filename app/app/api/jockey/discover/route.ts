import { NextRequest, NextResponse } from "next/server";
import {
  buildJockeyBody,
  callJockeyResponses,
  hasApiKey,
} from "@/lib/jockey/client";
import { INSTRUCTIONS } from "@/lib/jockey/instructions";
import { loadDemoManifest } from "@/lib/manifest";
import { resolveDiscoverRail } from "@/lib/jockey/resolve-asset";
import { DISCOVERY_SCHEMA } from "@/lib/jockey/schemas";
import { enrichClipsWithPersonalizationMetadata } from "@/lib/personalization-clip-metadata";
import {
  clonePersonalizationConfig,
  type PersonalizationConfig,
} from "@/lib/personalization-config";
import { isStoreKey, type DiscoverCachePayload } from "@/lib/types";

export async function POST(request: NextRequest) {
  if (!hasApiKey()) {
    return NextResponse.json(
      { error: "TL_API_KEY not configured", source: "live" },
      { status: 503 },
    );
  }
  const body = await request.json();
  const { storeKey, intent, personalizationConfig } = body as {
    storeKey: string;
    intent: string;
    personalizationConfig?: PersonalizationConfig;
  };
  if (!isStoreKey(storeKey) || !intent?.trim()) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    const jockeyBody = buildJockeyBody({
      storeKey,
      instructions: INSTRUCTIONS.discover,
      userContent: intent,
      schemaName: "personalized_discovery",
      schema: DISCOVERY_SCHEMA,
    });
    const { data, parsed, request: req } = await callJockeyResponses(jockeyBody);
    const manifest = loadDemoManifest();
    const response = parsed as DiscoverCachePayload["response"];
    const config = personalizationConfig
      ? clonePersonalizationConfig(personalizationConfig)
      : clonePersonalizationConfig({
          lookingFor: [],
          maxClipLengthMin: 20,
          negativeTargeting: [],
          characterSpotlight: [],
        });
    const resolved_clips = enrichClipsWithPersonalizationMetadata(
      resolveDiscoverRail(manifest, storeKey, response.recommended_rail ?? [], config),
      config,
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
