import { readFileSync, existsSync } from "fs";
import path from "path";
import { formatDisplayTags } from "./display-tags";
import { EXPLORE_TOTAL_CLIP_COUNT } from "./explore-layout";
import { loadJockeyV2Episode } from "./jockey-v2";
import { resolveSearchResults } from "./jockey/resolve-asset";
import type {
  DemoManifest,
  JockeyV2Hydration,
  SearchResultRaw,
  StoreKey,
} from "./types";

type HydrationAsset = {
  asset_reference: string;
  episode_timeline?: Array<{
    timestamp_start: string;
    timestamp_end: string;
    label: string;
    characters_present?: string[];
    action_description?: string;
    description?: string;
    reasoning?: string;
  }>;
  most_important_scene?: {
    timestamp_start: string;
    timestamp_end: string;
    title: string;
    characters_present?: string[];
    reasoning: string;
    description?: string;
  };
  topics?: string[];
  mood?: string[];
  scene_types?: string[];
};

type SceneCandidate = {
  assetId: string;
  timestamp_start: string;
  timestamp_end: string;
  scene_title: string;
  scene_description: string;
  alignment_reasoning: string;
  characters_present: string[];
  tags: string[];
  relevance_score: string;
  match_type: string;
  priority: number;
};

const DATA_DIR = path.join(process.cwd(), "data");
const MATCH_TYPES = ["visual", "semantic", "audio", "text_on_screen"] as const;

function loadSeedHydration(storeKey: string): HydrationAsset[] {
  const file = path.join(DATA_DIR, "jockey-cache", storeKey, "hydration.json");
  if (!existsSync(file)) return [];
  const data = JSON.parse(readFileSync(file, "utf-8")) as {
    response?: { assets?: HydrationAsset[] };
  };
  return data.response?.assets ?? [];
}

function tagsFromV2(v2: JockeyV2Hydration): string[] {
  return formatDisplayTags(v2.tags).slice(0, 5);
}

function tagsFromHydration(asset: HydrationAsset): string[] {
  const raw = [...(asset.scene_types ?? []), ...(asset.mood ?? []), ...(asset.topics ?? [])];
  return formatDisplayTags(raw).slice(0, 5);
}

function beatDescription(beat: {
  description?: string;
  action_description?: string;
}): string {
  const text = beat.description ?? beat.action_description ?? "";
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  return sentences.slice(0, 2).join(" ").trim() || text.slice(0, 220);
}

function collectV2Scenes(storeKey: StoreKey, assetIds: string[]): SceneCandidate[] {
  const scenes: SceneCandidate[] = [];

  for (const assetId of assetIds) {
    const v2 = loadJockeyV2Episode(storeKey, assetId);
    if (!v2) continue;

    const tags = tagsFromV2(v2);
    const hero = v2.most_important_scene;
    const castLine = (hero.characters_present ?? []).slice(0, 4).join(", ");

    scenes.push({
      assetId,
      timestamp_start: hero.timestamp_start,
      timestamp_end: hero.timestamp_end,
      scene_title: hero.title,
      scene_description: hero.description ?? beatDescription(hero),
      alignment_reasoning: `${hero.reasoning} ${castLine ? `Characters central to this beat include ${castLine}, which is why this moment ranks among the most important in the series.` : ""}`.trim(),
      characters_present: hero.characters_present ?? [],
      tags,
      relevance_score: "98",
      match_type: "semantic",
      priority: 100,
    });

    v2.episode_timeline.forEach((beat, index) => {
      if (index % 3 !== 1) return;
      const characters = beat.characters_present ?? [];
      scenes.push({
        assetId,
        timestamp_start: beat.timestamp_start,
        timestamp_end: beat.timestamp_end,
        scene_title: beat.label,
        scene_description: beatDescription(beat),
        alignment_reasoning: `${beat.reasoning} ${characters.length ? `In this beat, ${characters.join(", ")} drive the action — a defining moment for viewers following ${storeKey.replace(/_/g, " ")}.` : ""}`.trim(),
        characters_present: characters,
        tags: tags.slice(0, 3),
        relevance_score: String(92 - index),
        match_type: index % 2 === 0 ? "visual" : "semantic",
        priority: 80 - index,
      });
    });
  }

  return scenes;
}

function collectHydrationScenes(assets: HydrationAsset[]): SceneCandidate[] {
  const scenes: SceneCandidate[] = [];

  for (const asset of assets) {
    const tags = tagsFromHydration(asset);
    const hero = asset.most_important_scene;
    if (hero) {
      const castLine = (hero.characters_present ?? []).slice(0, 4).join(", ");
      scenes.push({
        assetId: asset.asset_reference,
        timestamp_start: hero.timestamp_start,
        timestamp_end: hero.timestamp_end,
        scene_title: hero.title,
        scene_description: hero.description ?? hero.reasoning.slice(0, 220),
        alignment_reasoning: `${hero.reasoning}${castLine ? ` Watch for ${castLine} — this is one of the episode's editorial anchors.` : ""}`,
        characters_present: hero.characters_present ?? [],
        tags,
        relevance_score: "97",
        match_type: "semantic",
        priority: 100,
      });
    }

    (asset.episode_timeline ?? []).forEach((beat, index) => {
      if (index % 4 !== 2) return;
      const characters = beat.characters_present ?? [];
      scenes.push({
        assetId: asset.asset_reference,
        timestamp_start: beat.timestamp_start,
        timestamp_end: beat.timestamp_end,
        scene_title: beat.label,
        scene_description: beatDescription(beat),
        alignment_reasoning: beat.reasoning ?? `${beat.label} stands out because ${characters.join(" and ") || "the cast"} carry the emotional turn of the scene.`,
        characters_present: characters,
        tags: tags.slice(0, 3),
        relevance_score: String(90 - index),
        match_type: MATCH_TYPES[index % MATCH_TYPES.length],
        priority: 70 - index,
      });
    });
  }

  return scenes;
}

function toSearchResults(scenes: SceneCandidate[]): SearchResultRaw[] {
  return scenes.map((scene) => ({
    asset_reference: scene.assetId,
    timestamp_start: scene.timestamp_start,
    timestamp_end: scene.timestamp_end,
    scene_title: scene.scene_title,
    description: scene.scene_description,
    match_type: scene.match_type,
    relevance_score: scene.relevance_score,
    scene_description: scene.scene_description,
    alignment_reasoning: scene.alignment_reasoning,
    tags: scene.tags,
    characters_present: scene.characters_present,
    match_signals: scene.tags.slice(0, 2),
  }));
}

export function buildDefaultExplorePayload(
  manifest: DemoManifest,
  storeKey: StoreKey,
  displayName: string,
) {
  const assetIds = manifest.stores[storeKey]?.asset_ids ?? [];
  let candidates = collectV2Scenes(storeKey, assetIds);

  if (candidates.length === 0) {
    candidates = collectHydrationScenes(loadSeedHydration(storeKey));
  }

  candidates.sort((a, b) => b.priority - a.priority);
  const top = candidates.slice(0, EXPLORE_TOTAL_CLIP_COUNT);
  const results = toSearchResults(top);
  const resolved = resolveSearchResults(manifest, storeKey, results).map((clip, i) => ({
    ...clip,
    id: `browse-${i}`,
  }));

  return {
    request: { model: "jockey1.0", mode: "browse" },
    response: {
      query_interpretation: `Most important scenes from ${displayName}`,
      total_results: results.length,
      results,
    },
    resolved_clips: resolved,
    mode: "browse" as const,
  };
}
