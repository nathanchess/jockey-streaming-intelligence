import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getSearchPresentation, PRESET_SEARCH_KEYWORDS } from "../app/lib/explore-search-presentation.ts";
import type { StoreKey } from "../app/lib/types.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "app", "data", "demo-manifest.json");
const DATA_DIR = path.join(ROOT, "app", "data");
const CACHE_DIR = path.join(DATA_DIR, "jockey-cache");

const SEARCH_RESULT_COUNT = 16;
const DISCOVER_RAIL_COUNT = 10;
const PROGRAM_SLOT_COUNT = 7;

type ManifestAsset = {
  id: string;
  store_key: string;
  series: string;
  episode_label: string;
  vertical: string;
  playback_url?: string | null;
  messy_metadata: { title: string };
  youtube_metadata: {
    youtube_id: string;
    original_title: string;
    thumbnail_url: string;
    duration_sec: number;
  };
  thumbnail_url: string;
  jockey: { asset_id: string };
};

type Manifest = {
  stores: Record<string, { display_name: string; vertical: string; asset_ids: string[] }>;
  assets: Record<string, ManifestAsset>;
};

const MATCH_TYPES = ["visual", "semantic", "audio", "text_on_screen"] as const;

function parseTs(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function parseTimestampString(ts: string): number {
  const base = ts.split(".")[0]?.trim() ?? ts;
  const parts = base.split(":").map(Number);
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  const n = Number(ts);
  return Number.isFinite(n) ? n : 0;
}

function playbackUrl(assetId: string, url?: string | null): string {
  if (url) return url;
  return `/api/media/${assetId}`;
}

function verticalHydration(asset: ManifestAsset) {
  const dur = asset.youtube_metadata.duration_sec;
  const epNum = parseInt(asset.episode_label.replace(/\D/g, "") || "1", 10);

  type CastDef = { name: string; role: string; description: string };
  type BeatDef = {
    startRatio: number;
    endRatio: number;
    label: string;
    characters: string[];
    arc: string;
    action: string;
  };

  const packs: Record<
    string,
    { cast: CastDef[]; beats: BeatDef[]; genre: string[]; mood: string[]; scene_types: string[]; audio: string[]; topics: string[] }
  > = {
    fast: {
      cast: [
        { name: "Gordon Ramsay", role: "Host / Head Chef", description: "Runs the kitchen, delivers eliminations, escalates pressure on teams." },
        { name: "Red Team Captain", role: "Contestant lead", description: `Leads the red brigade in ${asset.episode_label}; clashes with Ramsay during service.` },
        { name: "Blue Team Captain", role: "Contestant lead", description: `Commands the blue brigade; competes for menu control in ${asset.episode_label}.` },
        { name: "Sous Chef", role: "Kitchen staff", description: "Supports Ramsay and relays orders during dinner service." },
      ],
      beats: [
        { startRatio: 0.02, endRatio: 0.08, label: "Cold open briefing", characters: ["Gordon Ramsay", "Red Team Captain", "Blue Team Captain"], arc: "Neutral → anticipatory", action: "Ramsay outlines the signature-dish challenge; both captains react with competitive bravado." },
        { startRatio: 0.08, endRatio: 0.18, label: "Prep montage", characters: ["Red Team Captain", "Blue Team Captain"], arc: "Confidence → friction", action: "Teams plate prototypes; captains argue over timing and garnish choices within earshot of Ramsay." },
        { startRatio: 0.18, endRatio: 0.28, label: "First Ramsay pass", characters: ["Gordon Ramsay", "Red Team Captain"], arc: "Pride → humiliation", action: "Ramsay inspects the red station, tosses a poorly seared protein, and singles out the captain by name." },
        { startRatio: 0.28, endRatio: 0.38, label: "Service countdown", characters: ["Gordon Ramsay", "Sous Chef", "Blue Team Captain"], arc: "Tension → panic", action: "Doors open; Ramsay barks expediting calls while the blue captain struggles to fire appetizers on time." },
        { startRatio: 0.38, endRatio: 0.48, label: "Dinner-table blowup", characters: ["Gordon Ramsay", "Red Team Captain", "Blue Team Captain"], arc: "Frustration → explosive anger", action: "A mis-fired table triggers a three-way confrontation at the pass; Ramsay threatens to shut down the red kitchen." },
        { startRatio: 0.48, endRatio: 0.58, label: "Recovery beat", characters: ["Blue Team Captain", "Sous Chef"], arc: "Despair → determined focus", action: "The blue captain regroups the line, re-fires entrees, and earns a rare nod from the sous chef." },
        { startRatio: 0.58, endRatio: 0.72, label: "Elimination setup", characters: ["Gordon Ramsay", "Red Team Captain", "Blue Team Captain"], arc: "Anxiety → dread", action: "Ramsay gathers both teams and previews the elimination criteria, naming the weakest performers." },
        { startRatio: 0.72, endRatio: 0.85, label: "Elimination ceremony", characters: ["Gordon Ramsay", "Red Team Captain", "Blue Team Captain"], arc: "Dread → grief / relief", action: "Ramsay calls forward the bottom contestants; the red captain pleads for one more chance before a jacket is removed." },
        { startRatio: 0.85, endRatio: 0.95, label: "Closing reflection", characters: ["Gordon Ramsay", "Blue Team Captain"], arc: "Exhaustion → resolve", action: "Ramsay debriefs survivors; the blue captain vows to lead differently next service." },
      ],
      genre: ["Reality", "Competition"],
      mood: ["Intense", "Dramatic", "High-energy"],
      scene_types: ["Kitchen challenge", "Elimination", "Confrontation"],
      audio: ["Shouting", "Sizzle", "Dramatic sting"],
      topics: ["Culinary competition", "Team dynamics", "Elimination"],
    },
    micro_drama: {
      cast: [
        { name: "Lizzie Bennet", role: "Protagonist / vlogger", description: `Documents her life on camera in ${asset.episode_label}; narrates emotional beats directly to viewers.` },
        { name: "Jane Bennet", role: "Older sister", description: "Voice of reason; mediates family conflict with quiet empathy." },
        { name: "Lydia Bennet", role: "Younger sister", description: "Impulsive; escalates drama through social media posts." },
        { name: "Mrs. Bennet", role: "Mother", description: "Pushes marriage and status; creates awkward dinner tension." },
      ],
      beats: [
        { startRatio: 0.03, endRatio: 0.1, label: "Vlog hook", characters: ["Lizzie Bennet"], arc: "Casual → self-aware", action: "Lizzie opens with a breezy recap, then admits something felt off after last night's party." },
        { startRatio: 0.1, endRatio: 0.2, label: "Sister check-in", characters: ["Lizzie Bennet", "Jane Bennet"], arc: "Warmth → concern", action: "Jane visits Lizzie's room; they decode a cryptic text from a love interest." },
        { startRatio: 0.2, endRatio: 0.3, label: "Lydia's post", characters: ["Lydia Bennet", "Lizzie Bennet"], arc: "Amusement → irritation", action: "Lydia's viral post misquotes Lizzie; Lizzie confronts her on camera." },
        { startRatio: 0.3, endRatio: 0.42, label: "Family dinner", characters: ["Mrs. Bennet", "Lizzie Bennet", "Jane Bennet", "Lydia Bennet"], arc: "Civility → awkward tension", action: "Mrs. Bennet steers conversation to marriage; Lizzie pushes back while Jane tries to change the subject." },
        { startRatio: 0.42, endRatio: 0.52, label: "Confession cam", characters: ["Lizzie Bennet"], arc: "Defensive → vulnerable", action: "Alone, Lizzie tells viewers she fears being misread by both family and audience." },
        { startRatio: 0.52, endRatio: 0.62, label: "Romantic DM", characters: ["Lizzie Bennet", "Jane Bennet"], arc: "Hope → uncertainty", action: "Jane reads a heartfelt message aloud; Lizzie debates whether to reply on or off vlog." },
        { startRatio: 0.62, endRatio: 0.72, label: "Public misunderstanding", characters: ["Lizzie Bennet", "Lydia Bennet"], arc: "Embarrassment → anger", action: "Commenters twist Lizzie's words; Lydia fans the flames instead of defending her sister." },
        { startRatio: 0.72, endRatio: 0.82, label: "Sister reconciliation", characters: ["Lizzie Bennet", "Jane Bennet", "Lydia Bennet"], arc: "Hurt → forgiveness", action: "Jane brokers a truce; Lydia apologizes on camera with uncharacteristic sincerity." },
        { startRatio: 0.82, endRatio: 0.93, label: "Episode button", characters: ["Lizzie Bennet"], arc: "Reflective → optimistic", action: "Lizzie closes the vlog teasing next week's reveal while texting the love interest." },
      ],
      genre: ["Drama", "Romance", "Comedy"],
      mood: ["Witty", "Emotional", "Relatable"],
      scene_types: ["Vlog confession", "Dialogue", "Social gathering"],
      audio: ["Dialogue", "Music sting", "Ambient room tone"],
      topics: ["Relationships", "Social media", "Family dynamics"],
    },
    archive: {
      cast: [
        { name: "Julia Child", role: "Host / instructor", description: `Demonstrates French technique on camera in ${asset.episode_label} with warmth and humor.` },
        { name: "Guest Assistant", role: "Kitchen helper", description: "Hands Julia tools and ingredients during the demonstration." },
      ],
      beats: [
        { startRatio: 0.02, endRatio: 0.1, label: "Introduction", characters: ["Julia Child"], arc: "Welcoming → instructive", action: "Julia introduces the dish and lists ingredients to the home viewer." },
        { startRatio: 0.1, endRatio: 0.22, label: "Knife work", characters: ["Julia Child", "Guest Assistant"], arc: "Calm → precise focus", action: "Julia demonstrates julienne cuts while narrating safety and grip for beginners." },
        { startRatio: 0.22, endRatio: 0.34, label: "Sauté stage", characters: ["Julia Child"], arc: "Patient → enthusiastic", action: "Julia browns aromatics, explaining heat control as butter foams in the pan." },
        { startRatio: 0.34, endRatio: 0.46, label: "Wine reduction", characters: ["Julia Child", "Guest Assistant"], arc: "Instructional → playful", action: "Julia deglazes, jokes about measuring wine, and invites the assistant to stir." },
        { startRatio: 0.46, endRatio: 0.58, label: "Braise", characters: ["Julia Child"], arc: "Steady → anticipatory", action: "Julia covers the pot, describing how collagen breaks down over time." },
        { startRatio: 0.58, endRatio: 0.7, label: "Side preparation", characters: ["Julia Child", "Guest Assistant"], arc: "Collaborative → lighthearted", action: "Julia assigns the assistant a simple garnish while she tastes for salt." },
        { startRatio: 0.7, endRatio: 0.82, label: "Plating", characters: ["Julia Child"], arc: "Pride → satisfaction", action: "Julia plates the boeuf bourguignon, naming each component for the viewer." },
        { startRatio: 0.82, endRatio: 0.93, label: "Tasting & sign-off", characters: ["Julia Child"], arc: "Joy → warm closure", action: "Julia tastes, exclaims delight, and encourages viewers to try the recipe at home." },
      ],
      genre: ["Educational", "Documentary", "Cooking"],
      mood: ["Warm", "Instructional", "Charming"],
      scene_types: ["Cooking demonstration", "Instruction", "Technique close-up"],
      audio: ["Narration", "Kitchen sounds", "Audience laughter"],
      topics: ["French cuisine", "Technique", "Home cooking"],
    },
  };

  const vertical =
    asset.vertical === "fast"
      ? "fast"
      : asset.vertical === "micro_drama"
        ? "micro_drama"
        : "archive";
  const pack = packs[vertical];

  const episode_timeline = pack.beats.map((b) => ({
    timestamp_start: parseTs(Math.floor(dur * b.startRatio)),
    timestamp_end: parseTs(Math.floor(dur * b.endRatio)),
    label: b.label,
    characters_present: b.characters,
    emotional_arc: b.arc,
    action_description: b.action,
  }));

  const hero = pack.beats[Math.min(4 + (epNum % 3), pack.beats.length - 1)];
  const heroStart = Math.floor(dur * hero.startRatio);
  const heroEnd = Math.floor(dur * hero.endRatio);

  const castNames = pack.cast.map((c) => c.name);
  const lead = pack.cast[0].name;
  const second = pack.cast[1]?.name ?? lead;

  const summaryByVertical: Record<string, string> = {
    fast: `In ${asset.episode_label}, ${lead} drives a high-stakes service while ${second} and the brigade captains clash over execution. ${pack.cast[2]?.name ?? "The teams"} face mounting pressure culminating in a ceremony where ${lead} names who survives.`,
    micro_drama: `${lead} documents ${asset.episode_label} on camera as ${second} and ${pack.cast[2]?.name} pull her into family drama. ${pack.cast[3]?.name} amplifies tension at dinner before ${lead} and ${second} reconcile the sisters on vlog.`,
    archive: `${lead} walks viewers through a classic French preparation in ${asset.episode_label}, with ${second} assisting as she demonstrates technique, narrates each stage, and closes with her signature tasting moment.`,
  };

  const most_important_scene = {
    timestamp_start: parseTs(heroStart),
    timestamp_end: parseTs(heroEnd),
    title: hero.label,
    characters_present: hero.characters,
    reasoning: `Editorially, "${hero.label}" is the pivot of ${asset.episode_label}: ${hero.characters.join(" and ")} drive the ${hero.arc.toLowerCase()} arc. ${hero.action} This beat best represents the episode for clips, discovery, and programming because it names the characters viewers follow.`,
  };

  return {
    asset_reference: asset.id,
    title_suggested: asset.youtube_metadata.original_title.slice(0, 80),
    content_rating_signal: "TV-PG",
    genre: pack.genre,
    mood: pack.mood,
    characters: castNames,
    scene_types: pack.scene_types,
    audio_events: pack.audio,
    topics: pack.topics,
    summary: summaryByVertical[vertical],
    cast_analysis: pack.cast,
    episode_timeline,
    most_important_scene,
    scene_timestamps: episode_timeline.map((b) => ({
      label: b.label,
      timestamp_start: b.timestamp_start,
    })),
  };
}

const STORE_PRESETS: Record<
  string,
  Array<{ id: string; label: string; query: string; featured?: boolean }>
> = {
  hells_kitchen: [
    { id: "heated-argument", label: "Heated argument at the dinner table", query: "Heated argument at the dinner table", featured: true },
    { id: "chef-confrontation", label: "Chef confrontation with contestant", query: "Chef confrontation with contestant" },
    { id: "elimination-drama", label: "Elimination ceremony drama", query: "Elimination ceremony drama" },
  ],
  lizzie_bennet: [
    { id: "awkward-dinner", label: "Awkward family dinner moments", query: "Awkward family dinner moments", featured: true },
    { id: "confession-cam", label: "Emotional confession to camera", query: "Emotional confession to camera" },
    { id: "romantic-tension", label: "Romantic tension scene", query: "Romantic tension scene" },
  ],
  omeleto_reserve: [
    { id: "tense-silence", label: "Tense silence before the reveal", query: "Tense silence before the reveal", featured: true },
    { id: "dramatic-reveal", label: "Dramatic character reveal", query: "Dramatic character reveal" },
    { id: "emotional-climax", label: "Emotional climax scene", query: "Emotional climax scene" },
  ],
  french_chef: [
    { id: "knife-technique", label: "Julia demonstrating knife technique", query: "Julia demonstrating knife technique", featured: true },
    { id: "sauce-demo", label: "Classic sauce demonstration", query: "Classic sauce demonstration" },
    { id: "humor-moment", label: "Julia's humorous teaching moment", query: "Julia's humorous teaching moment" },
  ],
};

const PROFILE_INTENTS: Record<string, string> = {
  feel_good_family: "Looking for feel-good content, family-friendly, uplifting moments, under 20 min per clip",
  suspense_seeker: "Tense scenes, strong female lead, dramatic reveals, under 30 min per clip",
  fast_programmer: "90-min drama block, 18-34 female demo, prime-time competition energy",
};

const PROFILE_LABELS: Record<string, string> = {
  feel_good_family: "Feel-Good Family",
  suspense_seeker: "Suspense Seeker",
  fast_programmer: "FAST Programmer",
};

const PROFILE_RAIL_META: Record<string, { offset: number; signals: string[]; audienceReason: string }> = {
  feel_good_family: {
    offset: 0,
    signals: ["uplifting", "family-friendly", "short-form"],
    audienceReason:
      "delivers warmth and resolution without harsh conflict — ideal for co-viewing families",
  },
  suspense_seeker: {
    offset: 1,
    signals: ["tense", "female-lead", "dramatic"],
    audienceReason:
      "builds tension through character stakes and dramatic pacing that suspense fans expect",
  },
  fast_programmer: {
    offset: 2,
    signals: ["prime-time", "18-34", "competition"],
    audienceReason:
      "matches prime-time FAST scheduling with high-energy hooks for the 18-34 female demo",
  },
};

const PROFILE_BEAT_KEYWORDS: Record<string, string[]> = {
  feel_good_family: [
    "celebrat",
    "win",
    "praise",
    "excit",
    "recover",
    "camaraderie",
    "prize",
    "introduces",
    "aspir",
    "team",
    "bond",
    "uplift",
    "reconcil",
    "forgiv",
    "joy",
    "warm",
  ],
  suspense_seeker: [
    "tension",
    "pressure",
    "confront",
    "injur",
    "punish",
    "loss",
    "frustrat",
    "dramatic",
    "blowup",
    "elimination",
    "dread",
    "anxiety",
    "panic",
    "humiliat",
    "threaten",
    "stakes",
  ],
  fast_programmer: [
    "competition",
    "challenge",
    "judging",
    "score",
    "service",
    "prime",
    "energy",
    "head chef",
    "kitchen",
    "team",
    "lead",
    "momentum",
    "expedit",
  ],
};

const DEFAULT_BRIEFS: Record<string, string> = {
  hells_kitchen:
    "Build a 90-minute weeknight FAST block from Hell's Kitchen: open with high-energy Ramsay confrontations, rotate through service meltdowns and elimination stakes, target 18-34 female viewers, prime-time competition pacing.",
  lizzie_bennet:
    "Curate a 45-minute binge playlist from The Lizzie Bennet Diaries: witty vlog confessions, family drama beats, and will-they-won't-they tension for 18-34 female viewers.",
  omeleto_reserve:
    "Assemble a 60-minute short-drama anthology block from Omeleto reserve titles: emotional pivots, cinematic silence, and twist endings for 25-44 viewers.",
  french_chef:
    "Schedule a 60-minute Sunday morning cooking block from The French Chef: Julia Child technique demos, warm humor, and family-friendly pacing.",
};

const DEFAULT_BRIEF_INTERPRETATIONS: Record<string, string> = {
  hells_kitchen:
    "A 90-minute weeknight FAST block built from Hell's Kitchen service meltdowns, Ramsay confrontations, and elimination stakes — paced for 18-34 female viewers who want prime-time competition energy without slow filler between slots.",
  lizzie_bennet:
    "A 45-minute micro-drama playlist from The Lizzie Bennet Diaries sequenced for binge-friendly pacing — confessional vlog beats, family tension, and romantic glances tuned to 18-34 female co-viewing.",
  omeleto_reserve:
    "A 60-minute anthology block from Omeleto reserve shorts — each slot lands on an emotional pivot or twist, with cinematic pacing for 25-44 viewers who expect tension, silence, and payoff.",
  french_chef:
    "A 60-minute Sunday morning block from The French Chef — Julia Child demos, warm teaching humor, and family-friendly technique segments paced for relaxed co-viewing.",
};

function parseBriefMinutes(brief: string): number {
  const minuteMatch = brief.match(/(\d+)\s*[-\s]*(?:minutes?|mins?)\b/i);
  if (minuteMatch) return parseInt(minuteMatch[1], 10);

  const hourMatch = brief.match(/(\d+)\s*[-\s]*(?:hours?|hrs?)\b/i);
  if (hourMatch) return parseInt(hourMatch[1], 10) * 60;

  return 90;
}

type V2Episode = {
  tags?: string[];
  most_important_scene?: {
    timestamp_start: string;
    timestamp_end: string;
    title: string;
    description?: string;
    reasoning: string;
    characters_present?: string[];
  };
  episode_timeline?: Array<{
    timestamp_start: string;
    timestamp_end: string;
    label: string;
    description?: string;
    characters_present?: string[];
    reasoning?: string;
  }>;
};

function loadV2Episode(storeKey: string, assetId: string): V2Episode | null {
  const file = path.join(ROOT, "app", "data", "jockey-v2", "hydration", storeKey, `${assetId}.json`);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf-8")) as V2Episode;
}

function filterUserTags(tags: string[]): string[] {
  return tags.filter(
    (tag) =>
      !/hell'?s?\s*kitchen/i.test(tag) &&
      !/\bseason\b/i.test(tag) &&
      !/\bepisode\b/i.test(tag) &&
      !/\bpremiere\b/i.test(tag),
  );
}

function scoreBeatText(text: string, keywords: string[], query: string): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) score += 4;
  }
  for (const word of query.toLowerCase().split(/\W+/)) {
    if (word.length > 3 && lower.includes(word)) score += 2;
  }
  return score;
}

type BeatPick = {
  asset: ManifestAsset;
  scene_title: string;
  timestamp_start: string;
  timestamp_end: string;
  scene_description: string;
  alignment_reasoning: string;
  characters_present: string[];
  tags: string[];
  score: number;
};

function collectPresetBeatPicks(
  storeKey: string,
  assets: ManifestAsset[],
  hydrationAssets: ReturnType<typeof verticalHydration>[],
  preset: { id: string; query: string },
  count: number,
  keywordOverride?: string[],
): BeatPick[] {
  const keywords =
    keywordOverride ?? PRESET_SEARCH_KEYWORDS[storeKey as StoreKey]?.[preset.id] ?? [];
  const allPicks: BeatPick[] = [];

  for (let ai = 0; ai < assets.length; ai++) {
    const asset = assets[ai];
    const hydration = hydrationAssets[ai];
    const v2 = loadV2Episode(storeKey, asset.id);
    const tagPool = v2?.tags
      ? filterUserTags(v2.tags).slice(0, 5)
      : filterUserTags([
          ...(hydration.scene_types ?? []),
          ...(hydration.mood ?? []),
          ...(hydration.topics ?? []),
        ]).slice(0, 5);

    const beats = v2?.episode_timeline ?? hydration.episode_timeline ?? [];
    for (const beat of beats) {
      const rawDesc = beat.description ?? beat.action_description ?? beat.label;
      const sentences = rawDesc.match(/[^.!?]+[.!?]+/g) ?? [rawDesc];
      const sceneDesc = sentences.slice(0, 2).join(" ").trim();
      const characters = beat.characters_present ?? [];
      const castLine = characters.slice(0, 4).join(", ");
      const text = `${beat.label} ${rawDesc}`;
      allPicks.push({
        asset,
        scene_title: beat.label,
        timestamp_start: beat.timestamp_start,
        timestamp_end: beat.timestamp_end,
        scene_description: sceneDesc,
        alignment_reasoning: `${beat.reasoning ?? sceneDesc}${castLine ? ` Watch for ${castLine} in ${asset.episode_label}.` : ""}`,
        characters_present: characters,
        tags: tagPool,
        score: scoreBeatText(text, keywords, preset.query),
      });
    }

    const hero = v2?.most_important_scene ?? hydration.most_important_scene;
    if (hero) {
      const rawDesc = hero.description ?? hero.reasoning;
      const sentences = rawDesc.match(/[^.!?]+[.!?]+/g) ?? [rawDesc];
      const sceneDesc = sentences.slice(0, 2).join(" ").trim();
      const characters = hero.characters_present ?? [];
      const castLine = characters.slice(0, 4).join(", ");
      const text = `${hero.title} ${rawDesc}`;
      allPicks.push({
        asset,
        scene_title: hero.title,
        timestamp_start: hero.timestamp_start,
        timestamp_end: hero.timestamp_end,
        scene_description: sceneDesc,
        alignment_reasoning: `${hero.reasoning}${castLine ? ` Central figures: ${castLine}.` : ""}`,
        characters_present: characters,
        tags: tagPool,
        score: scoreBeatText(text, keywords, preset.query) + 1,
      });
    }
  }

  allPicks.sort((a, b) => b.score - a.score || a.asset.id.localeCompare(b.asset.id));

  const selected: BeatPick[] = [];
  const seenLabels = new Set<string>();
  const episodeCounts = new Map<string, number>();

  for (const pick of allPicks) {
    if (selected.length >= count) break;
    const labelKey = `${pick.asset.id}:${pick.scene_title}`.toLowerCase();
    if (seenLabels.has(labelKey)) continue;
    const epCount = episodeCounts.get(pick.asset.id) ?? 0;
    if (epCount >= 4) continue;
    seenLabels.add(labelKey);
    episodeCounts.set(pick.asset.id, epCount + 1);
    selected.push(pick);
  }

  // Fallback: preset-specific offset so every query still fills unique clips
  const offset = preset.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  let fi = 0;
  while (selected.length < count && fi < allPicks.length * 2) {
    const pick = allPicks[(offset + fi) % allPicks.length];
    const labelKey = `${pick.asset.id}:${pick.scene_title}`.toLowerCase();
    if (!seenLabels.has(labelKey)) {
      seenLabels.add(labelKey);
      selected.push(pick);
    }
    fi += 1;
  }

  return selected.slice(0, count);
}

function buildSearchResults(
  storeKey: string,
  assets: ManifestAsset[],
  hydrationAssets: ReturnType<typeof verticalHydration>[],
  preset: { id: string; label: string; query: string },
  count: number,
) {
  const picks = collectPresetBeatPicks(storeKey, assets, hydrationAssets, preset, count);
  const results = [];
  const resolved = [];

  picks.forEach((pick, i) => {
    const matchType = MATCH_TYPES[(i + preset.id.length) % MATCH_TYPES.length];
    const score = String(Math.min(98, 94 - i * 2 + (pick.score > 0 ? 2 : 0)));
    const castLine = pick.characters_present.slice(0, 4).join(", ");
    const alignment = castLine
      ? `This scene matches "${preset.query}" because ${castLine} drive the ${matchType} beat "${pick.scene_title}" in ${pick.asset.episode_label}. ${pick.alignment_reasoning} For viewers searching ${preset.query.toLowerCase()}, the combination of named characters, emotional stakes, and show-specific context makes this a strong ${matchType} match.`
      : `This scene matches "${preset.query}" because the ${matchType} moment "${pick.scene_title}" in ${pick.asset.episode_label} carries the emotional tone and subject matter the query describes. ${pick.scene_description}`;

    const row = {
      asset_reference: pick.asset.id,
      timestamp_start: pick.timestamp_start,
      timestamp_end: pick.timestamp_end,
      scene_title: pick.scene_title,
      description: pick.scene_description,
      match_type: matchType,
      relevance_score: score,
      scene_description: pick.scene_description,
      alignment_reasoning: alignment,
      tags: pick.tags,
      characters_present: pick.characters_present,
      match_signals: pick.tags.slice(0, 2),
    };
    results.push(row);
    resolved.push({
      id: `${preset.id}-${i}`,
      assetId: pick.asset.id,
      assetReference: pick.asset.id,
      episodeLabel: pick.asset.episode_label,
      videoSrc: playbackUrl(pick.asset.id, pick.asset.playback_url),
      youtubeId: pick.asset.youtube_metadata.youtube_id,
      startSec: parseTimestampString(row.timestamp_start),
      endSec: parseTimestampString(row.timestamp_end),
      thumbnailUrl: pick.asset.thumbnail_url,
      title: pick.scene_title,
      sceneTitle: pick.scene_title,
      description: pick.scene_description,
      matchType,
      relevanceScore: score,
      matchScore: score,
      sceneDescription: pick.scene_description,
      alignmentReasoning: alignment,
      tags: pick.tags,
      charactersPresent: pick.characters_present,
      matchSignals: row.match_signals,
    });
  });

  return { results, resolved };
}

const PROFILE_PERSONALIZATION: Record<
  string,
  {
    lookingFor: string[];
    negativeTargeting: string[];
    characterSpotlight: string[];
    maxClipLengthMin: number;
  }
> = {
  feel_good_family: {
    lookingFor: ["feel-good content", "family-friendly", "uplifting moments"],
    negativeTargeting: ["violence", "harsh language", "elimination drama"],
    characterSpotlight: ["Gordon Ramsay", "uplifting contestants"],
    maxClipLengthMin: 20,
  },
  suspense_seeker: {
    lookingFor: ["tense scenes", "strong female lead", "dramatic reveals"],
    negativeTargeting: ["feel-good filler", "slow pacing", "light comedy"],
    characterSpotlight: ["Gordon Ramsay", "high-stakes contestants"],
    maxClipLengthMin: 30,
  },
  fast_programmer: {
    lookingFor: ["prime-time competition energy", "18-34 female demo", "90-min drama block"],
    negativeTargeting: ["slow burns", "standalone episodes", "low-energy beats"],
    characterSpotlight: ["Gordon Ramsay", "competition front-runners"],
    maxClipLengthMin: 90,
  },
};

function pickProfileCharacterSpotlight(
  profileConfig: { characterSpotlight: string[] },
  characters: string[],
): string[] {
  const result: string[] = [];
  for (const preferred of profileConfig.characterSpotlight) {
    const lower = preferred.toLowerCase();
    if (lower.includes("contestant") || lower.includes("lead") || lower.includes("front-runner")) {
      const named = characters.filter(
        (name) => !/ramsay|sous chef|host|michelle tribble|james avery|julia child/i.test(name),
      );
      if (named.length > 0) {
        result.push(...named.slice(0, 2));
      }
      continue;
    }
    const match = characters.find(
      (name) =>
        name.toLowerCase().includes(lower) ||
        lower.includes(name.toLowerCase()) ||
        lower.split(/\s+/)[0] === name.toLowerCase(),
    );
    if (match) result.push(match);
    else if (characters.some((name) => name.toLowerCase().includes(lower.split(/\s+/)[0] ?? ""))) {
      result.push(preferred);
    }
  }
  const unique = [...new Set(result)];
  if (unique.length > 0) return unique.slice(0, 4);
  return characters.slice(0, 4);
}

function buildDiscoverAudienceReasoning(
  profileId: string,
  pick: BeatPick,
  profileConfig: (typeof PROFILE_PERSONALIZATION)[string],
): string {
  const profileLabel = PROFILE_LABELS[profileId];
  const meta = PROFILE_RAIL_META[profileId];
  const spotlight = pickProfileCharacterSpotlight(profileConfig, pick.characters_present);
  const castLine =
    spotlight.length > 0
      ? spotlight.join(", ")
      : pick.characters_present.slice(0, 3).join(", ") || "the featured cast";
  const interests = profileConfig.lookingFor.slice(0, 3).join(", ");
  const avoided = profileConfig.negativeTargeting.slice(0, 3).join(", ");

  return `For a ${profileLabel} viewer, "${pick.scene_title}" in ${pick.asset.episode_label} ${meta.audienceReason}. In this window, ${castLine} drive the beat: ${pick.scene_description} That aligns with your looking-for signals (${interests}) and keeps your configured character spotlight visible, while steering clear of ${avoided}.`;
}

function buildDiscoverRail(
  storeKey: string,
  assets: ManifestAsset[],
  hydrationAssets: ReturnType<typeof verticalHydration>[],
  profileId: string,
  intent: string,
  count: number,
) {
  const meta = PROFILE_RAIL_META[profileId];
  const profileConfig = PROFILE_PERSONALIZATION[profileId];
  const picks = collectPresetBeatPicks(
    storeKey,
    assets,
    hydrationAssets,
    { id: profileId, query: intent },
    count,
    PROFILE_BEAT_KEYWORDS[profileId] ?? [],
  );
  const rail = [];
  const resolved = [];

  picks.forEach((pick, i) => {
    const startSec = parseTimestampString(pick.timestamp_start);
    const endSec = parseTimestampString(pick.timestamp_end);
    const clipLengthMin = Math.max(1, Math.round(Math.abs(endSec - startSec) / 60));
    const audienceFit = Math.max(74, 97 - i * 2 + (pick.score > 0 ? 1 : 0));
    const clipTitle = pick.scene_title;
    const clipDescription = pick.scene_description;
    const characterSpotlight = pickProfileCharacterSpotlight(
      profileConfig,
      pick.characters_present,
    );
    const audienceReason = buildDiscoverAudienceReasoning(profileId, pick, profileConfig);
    const subFocus = `${clipTitle} — ${clipDescription.split(/[.!?]/)[0]?.trim() ?? clipDescription}`;
    const rationale = `${PROFILE_LABELS[profileId]} · ${subFocus}`;
    const tagPool = pick.tags.length > 0 ? pick.tags : meta.signals;

    const row = {
      rank: i + 1,
      asset_reference: pick.asset.id,
      title: clipTitle,
      clip_start: pick.timestamp_start,
      clip_end: pick.timestamp_end,
      rationale,
      match_signals: [...meta.signals, ...tagPool.slice(0, 2)],
      audience_alignment_reasoning: audienceReason,
      clip_label: clipTitle,
      clip_description: clipDescription,
      characters_present: pick.characters_present,
      sub_clip_focus: subFocus,
      matched_audience_interests: profileConfig.lookingFor.slice(0, 3),
      clip_length_minutes: clipLengthMin,
      avoided_themes: profileConfig.negativeTargeting.slice(0, 3),
      character_spotlight: characterSpotlight,
      audience_fit_score: audienceFit,
      interest_match_score: Math.max(70, audienceFit - 4),
      avoidance_score: Math.max(78, audienceFit - 6),
    };
    rail.push(row);
    resolved.push({
      id: `${profileId}-rail-${i}`,
      assetId: pick.asset.id,
      assetReference: pick.asset.id,
      episodeLabel: pick.asset.episode_label,
      videoSrc: playbackUrl(pick.asset.id, pick.asset.playback_url),
      youtubeId: pick.asset.youtube_metadata.youtube_id,
      startSec,
      endSec,
      thumbnailUrl: pick.asset.thumbnail_url,
      title: clipTitle,
      sceneTitle: clipTitle,
      description: clipDescription,
      sceneDescription: clipDescription,
      matchSignals: row.match_signals,
      charactersPresent: pick.characters_present,
      audienceAlignmentReasoning: audienceReason,
      clipLabel: clipTitle,
      subClipFocus: subFocus,
      rank: i + 1,
      personalizationMetadata: {
        clipDescription,
        reasoning: audienceReason,
        matchedAudienceInterests: row.matched_audience_interests,
        clipLengthMin: row.clip_length_minutes,
        avoidedThemes: row.avoided_themes,
        characterSpotlight: row.character_spotlight,
        fitScores: {
          audienceFit: row.audience_fit_score,
          interestMatch: row.interest_match_score,
          avoidanceConfidence: row.avoidance_score,
        },
      },
    });
  });

  return { rail, resolved };
}

function buildProgramLineup(
  storeKey: string,
  assets: ManifestAsset[],
  hydrationAssets: ReturnType<typeof verticalHydration>[],
  brief: string,
  storeName: string,
  count: number,
) {
  const targetMin = parseBriefMinutes(brief);
  const slotMin = Math.max(1, Math.round(targetMin / count));
  const meta = PROFILE_RAIL_META.fast_programmer;
  const profileConfig = PROFILE_PERSONALIZATION.fast_programmer;
  const picks = collectPresetBeatPicks(
    storeKey,
    assets,
    hydrationAssets,
    { id: "fast_programmer", query: brief },
    count,
    PROFILE_BEAT_KEYWORDS.fast_programmer,
  );
  const lineup = [];
  const resolved = [];

  picks.forEach((pick, i) => {
    const startSec = parseTimestampString(pick.timestamp_start);
    const endSec = Math.min(
      startSec + slotMin * 60,
      pick.asset.youtube_metadata.duration_sec,
    );
    const durationMin = slotMin;
    const prevPick = i > 0 ? picks[i - 1] : undefined;
    const nextPick = i < picks.length - 1 ? picks[i + 1] : undefined;
    const castLine = pick.characters_present.slice(0, 3).join(", ");
    const demoMatch = brief.match(/\b(\d{2}-\d{2})\s*female/i)?.[0] ?? "18-34 female";

    const row = {
      position: i + 1,
      asset_reference: pick.asset.id,
      title: pick.scene_title,
      clip_start: pick.timestamp_start,
      clip_end: parseTs(endSec),
      duration_minutes: durationMin,
      programming_rationale: `Slot ${i + 1} of ${count} sequences "${pick.scene_title}" from ${pick.asset.episode_label} into the ${storeName} FAST block. ${castLine ? `${castLine} drive the moment:` : ""} ${pick.scene_description} Placed here to sustain ${meta.signals[0]} energy across the ${targetMin}-minute lineup.`,
      lead_in_note:
        i === 0
          ? `Cold open: drop viewers into "${pick.scene_title}" with ${castLine || "the featured cast"} at peak stakes in ${pick.asset.episode_label}.`
          : `Transitions from "${prevPick!.scene_title}" (${prevPick!.asset.episode_label}) into ${pick.asset.episode_label}, keeping ${meta.signals[0]} intensity beat-for-beat.`,
      lead_out_note:
        i === count - 1
          ? `Closes the block on "${pick.scene_title}" before the next FAST promo.`
          : `Sets up "${nextPick!.scene_title}" in ${nextPick!.asset.episode_label} by leaving ${pick.characters_present[0] ?? "contestants"} in unresolved tension.`,
      jockey_reasoning: `Jockey indexed "${pick.scene_title}" in ${pick.asset.episode_label} for slot ${i + 1} because ${castLine || "this beat"} delivers ${profileConfig.lookingFor[0]} the brief targets. ${pick.alignment_reasoning}`,
      audience_fit: `For the ${demoMatch} demo in this FAST block, this window ${meta.audienceReason}. "${pick.scene_title}" surfaces ${meta.signals.slice(0, 2).join(" and ")} signals while steering clear of ${profileConfig.negativeTargeting.slice(0, 2).join(" and ")}.`,
    };
    lineup.push(row);
    resolved.push({
      id: `lineup-${i}`,
      assetId: pick.asset.id,
      assetReference: pick.asset.id,
      episodeLabel: pick.asset.episode_label,
      videoSrc: playbackUrl(pick.asset.id, pick.asset.playback_url),
      youtubeId: pick.asset.youtube_metadata.youtube_id,
      startSec,
      endSec,
      thumbnailUrl: pick.asset.thumbnail_url,
      title: row.title,
      sceneTitle: pick.scene_title,
      description: pick.scene_description,
      sceneDescription: pick.scene_description,
    });
  });

  return { lineup, resolved, totalRuntime: slotMin * count };
}

function writeJson(relPath: string, data: unknown) {
  const full = path.join(DATA_DIR, relPath);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, JSON.stringify(data, null, 2));
}

function main() {
  if (!existsSync(MANIFEST_PATH)) {
    throw new Error("Run sync-manifest first");
  }
  const manifest: Manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));
  mkdirSync(CACHE_DIR, { recursive: true });

  const cacheManifest: {
    version: number;
    generated_at: string;
    stores: Record<string, unknown>;
  } = {
    version: 1,
    generated_at: new Date().toISOString(),
    stores: {},
  };

  for (const [storeKey, store] of Object.entries(manifest.stores)) {
    const storeAssets = store.asset_ids.map((id) => manifest.assets[id]);
    const second = storeAssets[1] ?? storeAssets[0];

    const hydrationAssets = storeAssets.map(verticalHydration);
    writeJson(`jockey-cache/${storeKey}/hydration.json`, {
      request: { model: "jockey1.0", capability: "hydration" },
      response: { assets: hydrationAssets },
    });

    const presets = STORE_PRESETS[storeKey] ?? [];
    const presetEntries = [];
    const railClipIds: string[] = [];

    for (const preset of presets) {
      const { results, resolved } = buildSearchResults(storeKey, storeAssets, hydrationAssets, preset, SEARCH_RESULT_COUNT);
      if (preset.featured) {
        railClipIds.push(...resolved.slice(0, 6).map((c) => c.id));
      }

      const searchFile = `jockey-cache/${storeKey}/search/${preset.id}.json`;
      const presentation = getSearchPresentation(storeKey as StoreKey, preset.id);
      writeJson(searchFile, {
        request: { model: "jockey1.0", query: preset.query },
        response: {
          query_interpretation: `Searching for scenes matching: ${preset.query}`,
          total_results: results.length,
          results,
        },
        resolved_clips: resolved,
        session_id: `sess_seed_${storeKey}_${preset.id}`,
        ...(presentation ? { explore_presentation: presentation } : {}),
      });

      presetEntries.push({
        id: preset.id,
        label: preset.label,
        query: preset.query,
        file: searchFile,
        session_id: `sess_seed_${storeKey}_${preset.id}`,
        featured: preset.featured ?? false,
      });
    }

    const discover: Record<string, { intent: string; file: string; label: string }> = {};
    for (const [profileId, intent] of Object.entries(PROFILE_INTENTS)) {
      const { rail, resolved } = buildDiscoverRail(
        storeKey,
        storeAssets,
        hydrationAssets,
        profileId,
        intent,
        DISCOVER_RAIL_COUNT,
      );
      const discoverFile = `jockey-cache/${storeKey}/discover/${profileId}.json`;
      writeJson(discoverFile, {
        request: { model: "jockey1.0", intent },
        response: {
          viewer_intent_interpretation: intent,
          recommended_rail: rail,
        },
        resolved_clips: resolved,
      });
      discover[profileId] = { intent, file: discoverFile, label: PROFILE_LABELS[profileId] };
    }

    const brief = DEFAULT_BRIEFS[storeKey] ?? DEFAULT_BRIEFS.hells_kitchen;
    const briefInterpretation =
      DEFAULT_BRIEF_INTERPRETATIONS[storeKey] ?? DEFAULT_BRIEF_INTERPRETATIONS.hells_kitchen;
    const { lineup, resolved: programClips, totalRuntime } = buildProgramLineup(
      storeKey,
      storeAssets,
      hydrationAssets,
      brief,
      store.display_name,
      PROGRAM_SLOT_COUNT,
    );
    const programFile = `jockey-cache/${storeKey}/program/default.json`;
    writeJson(programFile, {
      request: { model: "jockey1.0", brief },
      response: {
        channel_brief_interpretation: briefInterpretation,
        lineup,
        total_runtime_minutes: totalRuntime,
        programming_notes: `${briefInterpretation} ${lineup.length} sequenced clips totaling ${totalRuntime} minutes.`,
      },
      resolved_clips: programClips,
    });

    cacheManifest.stores[storeKey] = {
      hydration: { file: `jockey-cache/${storeKey}/hydration.json` },
      search: {
        presets: presetEntries,
        rails: [
          {
            id: "top-moments",
            title: "Top moments",
            subtitle: `Browse top moments from ${store.display_name}`,
            clip_ids: railClipIds,
          },
        ],
      },
      discover,
      program: { default: { brief, file: programFile } },
    };
  }

  const hydratedManifest = {
    ...JSON.parse(readFileSync(MANIFEST_PATH, "utf-8")),
    updated_at: new Date().toISOString(),
  };
  for (const [, store] of Object.entries(manifest.stores)) {
    for (const id of store.asset_ids) {
      hydratedManifest.assets[id].hydrated_metadata = verticalHydration(manifest.assets[id]);
    }
  }
  writeFileSync(MANIFEST_PATH, JSON.stringify(hydratedManifest, null, 2));
  writeFileSync(path.join(DATA_DIR, "jockey-response-manifest.json"), JSON.stringify(cacheManifest, null, 2));
  console.log("Seeded jockey cache and merged hydration into demo-manifest.json");
}

main();
