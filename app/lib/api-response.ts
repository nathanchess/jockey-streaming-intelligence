import type { ResolvedClip } from "@/lib/types";

type JsonRecord = Record<string, unknown>;

function asRecord(data: unknown): JsonRecord {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Invalid response from server");
  }
  return data as JsonRecord;
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Request failed (${res.status})`);
  }

  const record = data && typeof data === "object" ? (data as JsonRecord) : null;
  if (!res.ok) {
    const msg =
      typeof record?.error === "string" ? record.error : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  if (record && typeof record.error === "string" && record.error) {
    throw new Error(record.error);
  }

  return data as T;
}

export function assertResolvedClipsPayload(
  data: unknown,
): asserts data is { resolved_clips: ResolvedClip[] } {
  const record = asRecord(data);
  if (!Array.isArray(record.resolved_clips)) {
    throw new Error("Response missing playable clips");
  }
}

export function assertProgramPayload(
  data: unknown,
): asserts data is { resolved_clips: ResolvedClip[]; response: { lineup?: unknown[] } } {
  const record = asRecord(data);
  if (!record.response || typeof record.response !== "object") {
    throw new Error("Response missing programming data");
  }
  if (!Array.isArray(record.resolved_clips)) {
    throw new Error("Response missing playable clips");
  }
}
