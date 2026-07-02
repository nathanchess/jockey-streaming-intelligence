export type Vertical = "fast" | "micro_drama" | "archive";

export type MessyMetadata = {
  title: string;
};

export type CastMember = {
  name: string;
  role: string;
  description: string;
};

export type TimelineBeat = {
  timestamp_start: string;
  timestamp_end: string;
  label: string;
  characters_present: string[];
  emotional_arc: string;
  action_description: string;
};

/** @deprecated Use episode_timeline */
export type NotableScene = {
  label: string;
  timestamp_start: string;
  timestamp_end: string;
  scene_description: string;
};

export type MostImportantScene = {
  timestamp_start: string;
  timestamp_end: string;
  title: string;
  reasoning: string;
  description?: string;
  characters_present?: string[];
};

export type V2TimelineBeat = {
  timestamp_start: string;
  timestamp_end: string;
  label: string;
  description: string;
  characters_present: string[];
  reasoning: string;
};

export type SeriesCastMember = {
  name: string;
  role: string;
  description: string;
  importance: string;
  cross_episode_reasoning: string;
  key_moments?: Array<{
    episode_label: string;
    description: string;
    timestamp_start: string;
    timestamp_end: string;
    reasoning: string;
  }>;
};

/** v2 experiment hydration (pass 2). v1 seed cache remains on hydrated_metadata. */
export type JockeyV2Hydration = {
  asset_title: string;
  tags: string[];
  characters_present: string[];
  episode_summary: string;
  episode_importance_in_series: string;
  most_important_scene: MostImportantScene;
  episode_timeline: V2TimelineBeat[];
};

export type SceneTimestamp = {
  label: string;
  timestamp_start: string;
};

export type HydratedMetadata = {
  asset_reference?: string;
  title_suggested?: string;
  genre?: string[];
  mood?: string[];
  characters?: string[];
  scene_types?: string[];
  audio_events?: string[];
  topics?: string[];
  content_rating_signal?: string;
  summary?: string;
  cast_analysis?: CastMember[];
  episode_timeline?: TimelineBeat[];
  /** @deprecated Use episode_timeline */
  notable_scenes?: NotableScene[];
  most_important_scene?: MostImportantScene;
  scene_timestamps?: SceneTimestamp[];
};

export type YoutubeMetadata = {
  youtube_id: string;
  original_title: string;
  thumbnail_url: string;
  webpage_url: string;
  duration_sec: number;
  channel?: string;
};

export type JockeyAssetRef = {
  knowledge_store_id: string;
  store_key: string;
  asset_id: string;
  item_id: string;
  asset_status: string;
  item_status: string;
  /** Previous knowledge-store item IDs that may still appear in live Jockey responses. */
  alias_item_ids?: string[];
};

export type DemoAsset = {
  id: string;
  store_key: string;
  series: string;
  episode_label: string;
  vertical: Vertical;
  url: string;
  messy_metadata: MessyMetadata;
  hydrated_metadata: HydratedMetadata | null;
  /** v2 library hydration from experiments/output; null if not yet analyzed */
  jockey_v2?: JockeyV2Hydration | null;
  series_cast?: SeriesCastMember[] | null;
  youtube_metadata: YoutubeMetadata;
  embed_url: string;
  playback_url?: string | null;
  thumbnail_url: string;
  duration_sec: number;
  jockey: JockeyAssetRef;
  processing?: { local_path?: string };
};

export type DemoStore = {
  knowledge_store_id: string;
  name: string;
  display_name: string;
  vertical: Vertical;
  asset_ids: string[];
};

export type DemoManifest = {
  updated_at: string;
  stores: Record<string, DemoStore>;
  assets: Record<string, DemoAsset>;
};

export type ResolvedClip = {
  id: string;
  assetId: string;
  assetReference: string;
  videoSrc: string;
  startSec: number;
  endSec: number;
  thumbnailUrl: string;
  title: string;
  sceneTitle?: string;
  description?: string;
  matchType?: string;
  relevanceScore?: string;
  matchScore?: string;
  sceneDescription?: string;
  alignmentReasoning?: string;
  matchSignals?: string[];
  tags?: string[];
  charactersPresent?: string[];
  audienceAlignmentReasoning?: string;
  clipLabel?: string;
  subClipFocus?: string;
  rank?: number;
  episodeLabel?: string;
  personalizationMetadata?: import("./personalization-clip-metadata").PersonalizationClipMetadata;
};

export type SearchResultRaw = {
  asset_reference: string;
  timestamp_start: string | number;
  timestamp_end: string | number;
  description: string;
  scene_title: string;
  match_type: string;
  relevance_score: string;
  scene_description: string;
  alignment_reasoning: string;
  match_signals?: string[];
  tags?: string[];
  characters_present?: string[];
};

export type SearchCachePayload = {
  request: Record<string, unknown>;
  response: {
    query_interpretation?: string;
    total_results?: number;
    results?: SearchResultRaw[];
  };
  resolved_clips: ResolvedClip[];
  session_id?: string;
  explore_presentation?: {
    featured_title: string;
    featured_subtitle: string;
    rails: Array<{
      id: string;
      title: string;
      subtitle: string;
      startIndex: number;
      endIndex: number;
    }>;
  };
};

export type DiscoverRailItemRaw = {
  rank: number;
  asset_reference: string;
  title: string;
  clip_start: string | number;
  clip_end: string | number;
  rationale: string;
  match_signals: string[];
  audience_alignment_reasoning?: string;
  clip_label?: string;
  clip_description?: string;
  characters_present?: string[];
  sub_clip_focus?: string;
  matched_audience_interests?: string[];
  clip_length_minutes?: number;
  avoided_themes?: string[];
  character_spotlight?: string[];
  audience_fit_score?: number;
  interest_match_score?: number;
  avoidance_score?: number;
};

export type DiscoverCachePayload = {
  request: Record<string, unknown>;
  response: {
    viewer_intent_interpretation?: string;
    recommended_rail?: DiscoverRailItemRaw[];
  };
  resolved_clips: ResolvedClip[];
};

export type ProgramLineupItemRaw = {
  position: number;
  asset_reference: string;
  title: string;
  clip_start: string;
  clip_end: string;
  duration_minutes: number;
  programming_rationale: string;
  lead_in_note: string;
  lead_out_note?: string;
  jockey_reasoning?: string;
  audience_fit?: string;
};

export type ProgramCachePayload = {
  request: Record<string, unknown>;
  response: {
    channel_brief_interpretation?: string;
    lineup?: ProgramLineupItemRaw[];
    total_runtime_minutes?: number;
    programming_notes?: string;
  };
  resolved_clips: ResolvedClip[];
};

export type ApiExchange = {
  endpoint: string;
  source: "cache" | "live";
  request: unknown;
  response: unknown;
  session_id?: string;
};

export const STORE_KEYS = [
  "hells_kitchen",
  "lizzie_bennet",
  "omeleto_reserve",
  "french_chef",
] as const;

export type StoreKey = (typeof STORE_KEYS)[number];

export const VIEWER_PROFILES = [
  { id: "feel_good_family", label: "Feel-Good Family" },
  { id: "suspense_seeker", label: "Suspense Seeker" },
  { id: "fast_programmer", label: "FAST Programmer" },
] as const;

export type ViewerProfileId = (typeof VIEWER_PROFILES)[number]["id"];

export function isStoreKey(value: string): value is StoreKey {
  return (STORE_KEYS as readonly string[]).includes(value);
}

export function parseTimestamp(ts: string | number): number {
  if (typeof ts === "number" && Number.isFinite(ts)) return ts;
  const str = String(ts);
  const base = str.split(".")[0]?.trim() ?? str;
  const parts = base.split(":").map(Number);
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  const n = Number(str);
  return Number.isFinite(n) ? n : 0;
}

/** Safe seek time for HTMLMediaElement — never returns NaN/Infinity. */
export function clampMediaTime(sec: number, fallback = 0): number {
  if (!Number.isFinite(sec) || sec < 0) return fallback;
  return sec;
}

export function formatTimestamp(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Human-readable duration without seconds (for library stats). */
export function formatDurationLabel(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${Math.floor(sec)}s`;
}

/** Strip fractional seconds and leading 00: from timestamp strings. */
export function formatDisplayTimestamp(ts: string): string {
  const base = ts.split(".")[0]?.trim() ?? ts;
  if (base.startsWith("00:")) return base.slice(3);
  return base;
}

export function parseBriefTargetMinutes(brief: string): number | null {
  const minuteMatch = brief.match(/(\d+)\s*[-\s]*(?:minutes?|mins?)\b/i);
  if (minuteMatch) return parseInt(minuteMatch[1], 10);

  const hourMatch = brief.match(/(\d+)\s*[-\s]*(?:hours?|hrs?)\b/i);
  if (hourMatch) return parseInt(hourMatch[1], 10) * 60;

  return null;
}
