const BASE_URL = "https://api.twelvelabs.io/v1.3";

export type JockeyResponseResult = {
  output?: Array<{
    type: string;
    content?: Array<{ type: string; text?: string }>;
  }>;
  session_id?: string;
};

function getApiKey(): string {
  const key = process.env.TL_API_KEY;
  if (!key) {
    throw new Error("TL_API_KEY is not configured");
  }
  return key;
}

export function getKnowledgeStoreId(storeKey: string): string {
  const raw = process.env.KNOWLEDGE_STORE_IDS;
  if (!raw) throw new Error("KNOWLEDGE_STORE_IDS is not configured");
  const map = JSON.parse(raw) as Record<string, string>;
  const id = map[storeKey];
  if (!id) throw new Error(`No knowledge store for ${storeKey}`);
  return id;
}

export async function callJockeyResponses(
  body: Record<string, unknown>,
  retries = 3,
): Promise<{ data: JockeyResponseResult; parsed: unknown; request: Record<string, unknown> }> {
  const apiKey = getApiKey();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(`${BASE_URL}/responses`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (res.status === 429 && attempt < retries - 1) {
      await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
      continue;
    }

    if (!res.ok) {
      const text = await res.text();
      lastError = new Error(`Jockey API ${res.status}: ${text.slice(0, 500)}`);
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
        continue;
      }
      throw lastError;
    }

    const data = (await res.json()) as JockeyResponseResult;
    const text = data.output
      ?.flatMap((o) => o.content ?? [])
      .find((c) => c.type === "output_text")?.text;

    let parsed: unknown = {};
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { raw: text };
      }
    }

    return { data, parsed, request: body };
  }

  throw lastError ?? new Error("Jockey request failed");
}

import { TOKEN_LIMITS } from "./schemas";

export function buildJockeyBody(opts: {
  storeKey: string;
  instructions: string;
  userContent: string;
  schemaName: string;
  schema: Record<string, unknown>;
  sessionId?: string;
  maxOutputTokens?: number;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: "jockey1.0",
    knowledge_store_id: getKnowledgeStoreId(opts.storeKey),
    instructions: opts.instructions,
    input: [
      {
        type: "message",
        role: "user",
        content: opts.userContent,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: opts.schemaName,
        schema: opts.schema,
      },
    },
    max_output_tokens:
      opts.maxOutputTokens ?? TOKEN_LIMITS[opts.schemaName] ?? 8192,
  };
  if (opts.sessionId) body.session_id = opts.sessionId;
  return body;
}

export function hasApiKey(): boolean {
  return Boolean(process.env.TL_API_KEY);
}
