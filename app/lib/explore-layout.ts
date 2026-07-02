import type { StoreKey } from "./types";

export const EXPLORE_FEATURED_CLIP_COUNT = 4;
export const EXPLORE_RAIL_CLIP_COUNT = 4;
export const EXPLORE_RAIL_COUNT = 3;
export const EXPLORE_TOTAL_CLIP_COUNT =
  EXPLORE_FEATURED_CLIP_COUNT + EXPLORE_RAIL_CLIP_COUNT * EXPLORE_RAIL_COUNT;

export type ExploreRailLayout = {
  id: string;
  title: string;
  subtitle: string;
  startIndex: number;
  endIndex: number;
};

export type ExploreBrowseLayout = {
  featured: { title: string; subtitle: string; slideCount: number };
  rails: ExploreRailLayout[];
};

export type ExploreLayout = {
  browse: ExploreBrowseLayout;
  search: ExploreBrowseLayout;
  typewriterQueries: string[];
};

export function buildExploreRailLayouts(
  rails: Array<{ id: string; title: string; subtitle: string }>,
): ExploreRailLayout[] {
  return rails.map((rail, i) => ({
    ...rail,
    startIndex: EXPLORE_FEATURED_CLIP_COUNT + i * EXPLORE_RAIL_CLIP_COUNT,
    endIndex: EXPLORE_FEATURED_CLIP_COUNT + (i + 1) * EXPLORE_RAIL_CLIP_COUNT - 1,
  }));
}

export const EXPLORE_LAYOUT: Record<StoreKey, ExploreLayout> = {
  hells_kitchen: {
    browse: {
      featured: {
        title: "Most important scenes from Hell's Kitchen",
        subtitle: "Editorial highlights drawn from Jockey's full-series analysis — signature wins, meltdowns, and turning points",
        slideCount: EXPLORE_FEATURED_CLIP_COUNT,
      },
      rails: [
        {
          id: "signature-moments",
          title: "Signature Moments",
          subtitle: "Challenge peaks and Ramsay confrontations that define the season",
          startIndex: 4,
          endIndex: 7,
        },
        {
          id: "team-dynamics",
          title: "Team Dynamics",
          subtitle: "Red vs Blue clashes, punishments, and brigade chemistry",
          startIndex: 8,
          endIndex: 11,
        },
        {
          id: "character-arcs",
          title: "Character Arcs",
          subtitle: "Contestants who rise, stumble, or steal the episode",
          startIndex: 12,
          endIndex: 15,
        },
      ],
    },
    search: {
      featured: {
        title: "Featured pick",
        subtitle: "Highest-confidence matches for your search",
        slideCount: EXPLORE_FEATURED_CLIP_COUNT,
      },
      rails: [
        {
          id: "top-moments",
          title: "Top Moments",
          subtitle: "Strongest matches across the library",
          startIndex: 4,
          endIndex: 7,
        },
        {
          id: "related-tension",
          title: "Related Tension",
          subtitle: "Scenes with similar stakes and emotional tone",
          startIndex: 8,
          endIndex: 11,
        },
        {
          id: "more-matches",
          title: "More Matches",
          subtitle: "Additional results worth exploring",
          startIndex: 12,
          endIndex: 15,
        },
      ],
    },
    typewriterQueries: [
      "Heated argument at the dinner table",
      "Chef confrontation with contestant",
      "Elimination ceremony drama",
    ],
  },
  lizzie_bennet: {
    browse: {
      featured: {
        title: "Most important scenes from The Lizzie Bennet Diaries",
        subtitle: "Pivotal vlog beats — family dinners, confessions, and romantic near-misses",
        slideCount: EXPLORE_FEATURED_CLIP_COUNT,
      },
      rails: [
        {
          id: "signature-moments",
          title: "Signature Moments",
          subtitle: "Memorable Bennet family interactions",
          startIndex: 4,
          endIndex: 7,
        },
        {
          id: "confession-cam",
          title: "Confession Cam",
          subtitle: "Direct-to-camera emotional beats",
          startIndex: 8,
          endIndex: 11,
        },
        {
          id: "romantic-tension",
          title: "Romantic Tension",
          subtitle: "Glances, DMs, and awkward pauses",
          startIndex: 12,
          endIndex: 15,
        },
      ],
    },
    search: {
      featured: {
        title: "Featured pick",
        subtitle: "Best matches for your search",
        slideCount: EXPLORE_FEATURED_CLIP_COUNT,
      },
      rails: [
        {
          id: "top-moments",
          title: "Top Moments",
          subtitle: "Strongest matches across the vlog",
          startIndex: 4,
          endIndex: 7,
        },
        {
          id: "confession-cam",
          title: "Confession Cam",
          subtitle: "Emotional direct-address beats",
          startIndex: 8,
          endIndex: 11,
        },
        {
          id: "romantic-tension",
          title: "Romantic Tension",
          subtitle: "Will-they-won't-they energy",
          startIndex: 12,
          endIndex: 15,
        },
      ],
    },
    typewriterQueries: [
      "Awkward family dinner moments",
      "Emotional confession to camera",
      "Romantic tension scene",
    ],
  },
  omeleto_reserve: {
    browse: {
      featured: {
        title: "Most important scenes from Omeleto",
        subtitle: "Peak storytelling beats from the short-film reserve",
        slideCount: EXPLORE_FEATURED_CLIP_COUNT,
      },
      rails: [
        {
          id: "visual-peaks",
          title: "Visual Peaks",
          subtitle: "Cinematic frames that carry the story",
          startIndex: 4,
          endIndex: 7,
        },
        {
          id: "dramatic-reveals",
          title: "Dramatic Reveals",
          subtitle: "Turning points that reframe everything",
          startIndex: 8,
          endIndex: 11,
        },
        {
          id: "emotional-climax",
          title: "Emotional Climax",
          subtitle: "Quiet punches of feeling",
          startIndex: 12,
          endIndex: 15,
        },
      ],
    },
    search: {
      featured: {
        title: "Featured pick",
        subtitle: "Best matches for your search",
        slideCount: EXPLORE_FEATURED_CLIP_COUNT,
      },
      rails: [
        {
          id: "top-moments",
          title: "Top Moments",
          subtitle: "Strongest visual storytelling matches",
          startIndex: 4,
          endIndex: 7,
        },
        {
          id: "dramatic-reveals",
          title: "Dramatic Reveals",
          subtitle: "Turning points aligned with your query",
          startIndex: 8,
          endIndex: 11,
        },
        {
          id: "emotional-climax",
          title: "Emotional Climax",
          subtitle: "Raw emotional payoffs",
          startIndex: 12,
          endIndex: 15,
        },
      ],
    },
    typewriterQueries: [
      "Tense silence before the reveal",
      "Dramatic character reveal",
      "Emotional climax scene",
    ],
  },
  french_chef: {
    browse: {
      featured: {
        title: "Most important scenes from The French Chef",
        subtitle: "Julia's defining demonstrations — technique, warmth, and classic French method",
        slideCount: EXPLORE_FEATURED_CLIP_COUNT,
      },
      rails: [
        {
          id: "technique-highlights",
          title: "Technique Highlights",
          subtitle: "Knife work, prep, and foundational skills",
          startIndex: 4,
          endIndex: 7,
        },
        {
          id: "classic-demonstrations",
          title: "Classic Demonstrations",
          subtitle: "Sauces, braises, and step-by-step mastery",
          startIndex: 8,
          endIndex: 11,
        },
        {
          id: "julia-unfiltered",
          title: "Julia Unfiltered",
          subtitle: "Humor, warmth, and unforgettable asides",
          startIndex: 12,
          endIndex: 15,
        },
      ],
    },
    search: {
      featured: {
        title: "Featured pick",
        subtitle: "Best matches for your search",
        slideCount: EXPLORE_FEATURED_CLIP_COUNT,
      },
      rails: [
        {
          id: "technique-highlights",
          title: "Technique Highlights",
          subtitle: "Matches for technique-focused queries",
          startIndex: 4,
          endIndex: 7,
        },
        {
          id: "classic-demonstrations",
          title: "Classic Demonstrations",
          subtitle: "Sauces, plating, and method",
          startIndex: 8,
          endIndex: 11,
        },
        {
          id: "julia-unfiltered",
          title: "Julia Unfiltered",
          subtitle: "Teaching moments with personality",
          startIndex: 12,
          endIndex: 15,
        },
      ],
    },
    typewriterQueries: [
      "Julia demonstrating knife technique",
      "Classic sauce demonstration",
      "Julia's humorous teaching moment",
    ],
  },
};

export function getExploreLayout(storeKey: StoreKey): ExploreLayout {
  return EXPLORE_LAYOUT[storeKey];
}

/** Layout for live search when no cached presentation exists. */
export function buildDynamicSearchLayout(
  clipCount: number,
  title: string,
  subtitle: string,
): ExploreBrowseLayout {
  const featuredCount = Math.min(EXPLORE_FEATURED_CLIP_COUNT, Math.max(clipCount, 0));
  const rails: ExploreRailLayout[] = [];
  if (clipCount > featuredCount) {
    const remaining = clipCount - featuredCount;
    const chunk = Math.max(EXPLORE_RAIL_CLIP_COUNT, Math.ceil(remaining / EXPLORE_RAIL_COUNT));
    const railDefs = [
      { id: "top-moments", title: "Top Moments", subtitle: "Strongest matches across the library" },
      {
        id: "related-scenes",
        title: "Related Scenes",
        subtitle: "Scenes with similar stakes and emotional tone",
      },
      { id: "more-matches", title: "More Matches", subtitle: "Additional results worth exploring" },
    ];
    let start = featuredCount;
    for (let i = 0; i < railDefs.length && start < clipCount; i += 1) {
      const end = Math.min(start + chunk - 1, clipCount - 1);
      rails.push({ ...railDefs[i], startIndex: start, endIndex: end });
      start = end + 1;
    }
  }
  return {
    featured: { title, subtitle, slideCount: featuredCount || 1 },
    rails,
  };
}

export function getExploreSectionLayout(
  layout: ExploreLayout,
  mode: "browse" | "search",
): ExploreBrowseLayout {
  return mode === "browse" ? layout.browse : layout.search;
}
