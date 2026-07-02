import type { ExploreRailLayout } from "./explore-layout";
import type { StoreKey } from "./types";

export type ExploreSearchPresentation = {
  featured_title: string;
  featured_subtitle: string;
  rails: ExploreRailLayout[];
};

export const JOCKEY_PROGRAM_LOADING_MESSAGES: Record<StoreKey, string[]> = {
  hells_kitchen: [
    "Sequencing pass-side blow-ups into prime-time slots…",
    "Balancing Ramsay confrontations across the block…",
    "Checking runtime against the 90-minute target…",
    "Matching elimination stakes to weeknight pacing…",
    "Building lead-ins between service meltdowns…",
  ],
  lizzie_bennet: [
    "Ordering vlog beats for binge-friendly pacing…",
    "Threading confessions into a 45-minute arc…",
    "Timing awkward pauses between family drama…",
    "Matching micro-drama clips to audience demo…",
    "Checking lead-outs before the next reveal…",
  ],
  omeleto_reserve: [
    "Curating anthology beats by emotional pivot…",
    "Measuring silence before each twist ending…",
    "Balancing short-drama runtimes in the block…",
    "Sequencing cinematic close-ups for retention…",
    "Checking total runtime against the brief…",
  ],
  french_chef: [
    "Scheduling Julia's technique demos across the morning…",
    "Balancing knife skills with warm teaching moments…",
    "Checking family-friendly pacing in each slot…",
    "Sequencing sauce demos before the next segment…",
    "Matching runtime to the Sunday block target…",
  ],
};

export const JOCKEY_LOADING_MESSAGES: Record<StoreKey, string[]> = {
  hells_kitchen: [
    "Checking if anyone's about to get yelled at…",
    "Scanning the pass for flying plates…",
    "Listening for 'WHERE'S THE LAMB SAUCE'…",
    "Measuring Ramsay disappointment levels…",
    "Rewinding every 'donkey' moment…",
  ],
  lizzie_bennet: [
    "Scrubbing through awkward pauses…",
    "Reading between vlog jump cuts…",
    "Detecting side-eye at family dinner…",
    "Finding confessions meant for the camera…",
    "Timing the will-they-won't-they glances…",
  ],
  omeleto_reserve: [
    "Holding breath before the reveal…",
    "Tracing the silence before the sting…",
    "Following the camera push-in…",
    "Measuring emotional damage in close-up…",
    "Finding the frame that changes everything…",
  ],
  french_chef: [
    "Watching Julia wield the knife…",
    "Listening for the butter sizzle…",
    "Catching a classic technique demo…",
    "Finding the perfect 'bon appétit' moment…",
    "Timing the wine pour just right…",
  ],
};

export const SEARCH_PRESENTATION: Record<
  StoreKey,
  Record<string, ExploreSearchPresentation>
> = {
  hells_kitchen: {
    "heated-argument": {
      featured_title: "Kitchen confrontations that boil over",
      featured_subtitle:
        "Jockey found pass-side blow-ups and service meltdowns tied to your search",
      rails: [
        {
          id: "peak-tension",
          title: "Peak Tension",
          subtitle: "Highest-stakes arguments and brigade clashes",
          startIndex: 4,
          endIndex: 7,
        },
        {
          id: "service-breakdowns",
          title: "Service Breakdowns",
          subtitle: "Dinner service moments where tempers snap",
          startIndex: 8,
          endIndex: 11,
        },
        {
          id: "more-matches",
          title: "More Matches",
          subtitle: "Additional scenes with similar heat",
          startIndex: 12,
          endIndex: 15,
        },
      ],
    },
    "chef-confrontation": {
      featured_title: "Ramsay vs. the brigade",
      featured_subtitle: "Direct chef confrontations Jockey matched to your query",
      rails: [
        {
          id: "head-to-head",
          title: "Head to Head",
          subtitle: "Face-to-face kitchen standoffs",
          startIndex: 4,
          endIndex: 7,
        },
        {
          id: "call-outs",
          title: "Call-Outs",
          subtitle: "Contestants singled out at the pass",
          startIndex: 8,
          endIndex: 11,
        },
        {
          id: "fallout",
          title: "Fallout",
          subtitle: "Aftermath and team friction",
          startIndex: 12,
          endIndex: 15,
        },
      ],
    },
    "elimination-drama": {
      featured_title: "Elimination night tension",
      featured_subtitle: "Send-offs and ceremony drama Jockey surfaced for you",
      rails: [
        {
          id: "the-walk",
          title: "The Walk",
          subtitle: "Contestants called forward under pressure",
          startIndex: 4,
          endIndex: 7,
        },
        {
          id: "jacket-off",
          title: "Jacket Off",
          subtitle: "The moment the jacket comes off",
          startIndex: 8,
          endIndex: 11,
        },
        {
          id: "reactions",
          title: "Reactions",
          subtitle: "Brigade response and raw emotion",
          startIndex: 12,
          endIndex: 15,
        },
      ],
    },
  },
  lizzie_bennet: {
    "awkward-dinner": {
      featured_title: "Awkward family beats",
      featured_subtitle: "Cringe-worthy dinner table moments Jockey found",
      rails: [
        {
          id: "table-tension",
          title: "Table Tension",
          subtitle: "Family dinners gone sideways",
          startIndex: 4,
          endIndex: 7,
        },
        {
          id: "side-comments",
          title: "Side Comments",
          subtitle: "Passive-aggressive asides and eye rolls",
          startIndex: 8,
          endIndex: 11,
        },
        {
          id: "aftermath",
          title: "Aftermath",
          subtitle: "Processing it on camera later",
          startIndex: 12,
          endIndex: 15,
        },
      ],
    },
    "confession-cam": {
      featured_title: "Confession cam highlights",
      featured_subtitle: "Direct-to-camera emotional beats from Jockey",
      rails: [
        {
          id: "vulnerable",
          title: "Vulnerable",
          subtitle: "Raw honesty straight to the lens",
          startIndex: 4,
          endIndex: 7,
        },
        {
          id: "realizations",
          title: "Realizations",
          subtitle: "Moments of clarity mid-vlog",
          startIndex: 8,
          endIndex: 11,
        },
        {
          id: "more-confessions",
          title: "More Confessions",
          subtitle: "Additional emotional matches",
          startIndex: 12,
          endIndex: 15,
        },
      ],
    },
    "romantic-tension": {
      featured_title: "Will-they-won't-they energy",
      featured_subtitle: "Romantic near-misses Jockey matched to your search",
      rails: [
        {
          id: "glances",
          title: "Glances",
          subtitle: "Looks that say everything",
          startIndex: 4,
          endIndex: 7,
        },
        {
          id: "almost-said-it",
          title: "Almost Said It",
          subtitle: "Words left unsaid on camera",
          startIndex: 8,
          endIndex: 11,
        },
        {
          id: "more-sparks",
          title: "More Sparks",
          subtitle: "Extra romantic tension matches",
          startIndex: 12,
          endIndex: 15,
        },
      ],
    },
  },
  omeleto_reserve: {
    "tense-silence": {
      featured_title: "Silence before the storm",
      featured_subtitle: "Quiet beats Jockey found before everything breaks",
      rails: [
        {
          id: "held-breath",
          title: "Held Breath",
          subtitle: "Stillness that builds dread",
          startIndex: 4,
          endIndex: 7,
        },
        {
          id: "the-wait",
          title: "The Wait",
          subtitle: "Suspense in a single frame",
          startIndex: 8,
          endIndex: 11,
        },
        {
          id: "more-quiet",
          title: "More Quiet",
          subtitle: "Additional tense pauses",
          startIndex: 12,
          endIndex: 15,
        },
      ],
    },
    "dramatic-reveal": {
      featured_title: "Turning-point reveals",
      featured_subtitle: "Story pivots Jockey surfaced for your query",
      rails: [
        {
          id: "the-turn",
          title: "The Turn",
          subtitle: "Moments that reframe the story",
          startIndex: 4,
          endIndex: 7,
        },
        {
          id: "aftershock",
          title: "Aftershock",
          subtitle: "Reactions to the reveal",
          startIndex: 8,
          endIndex: 11,
        },
        {
          id: "more-reveals",
          title: "More Reveals",
          subtitle: "Additional dramatic matches",
          startIndex: 12,
          endIndex: 15,
        },
      ],
    },
    "emotional-climax": {
      featured_title: "Emotional payoffs",
      featured_subtitle: "Climactic beats Jockey matched to your search",
      rails: [
        {
          id: "the-break",
          title: "The Break",
          subtitle: "When feeling finally surfaces",
          startIndex: 4,
          endIndex: 7,
        },
        {
          id: "release",
          title: "Release",
          subtitle: "Catharsis on screen",
          startIndex: 8,
          endIndex: 11,
        },
        {
          id: "more-climax",
          title: "More Climax",
          subtitle: "Additional emotional peaks",
          startIndex: 12,
          endIndex: 15,
        },
      ],
    },
  },
  french_chef: {
    "knife-technique": {
      featured_title: "Knife work with Julia",
      featured_subtitle: "Technique demos Jockey found for your search",
      rails: [
        {
          id: "prep-basics",
          title: "Prep Basics",
          subtitle: "Foundational cuts and grip",
          startIndex: 4,
          endIndex: 7,
        },
        {
          id: "close-ups",
          title: "Close-Ups",
          subtitle: "Camera-friendly technique moments",
          startIndex: 8,
          endIndex: 11,
        },
        {
          id: "more-technique",
          title: "More Technique",
          subtitle: "Additional knife matches",
          startIndex: 12,
          endIndex: 15,
        },
      ],
    },
    "sauce-demo": {
      featured_title: "Classic French sauces",
      featured_subtitle: "Sauce demonstrations Jockey matched to your query",
      rails: [
        {
          id: "the-base",
          title: "The Base",
          subtitle: "Building flavor from the pan",
          startIndex: 4,
          endIndex: 7,
        },
        {
          id: "reduction",
          title: "Reduction",
          subtitle: "Wine, butter, and patience",
          startIndex: 8,
          endIndex: 11,
        },
        {
          id: "more-sauces",
          title: "More Sauces",
          subtitle: "Additional demo matches",
          startIndex: 12,
          endIndex: 15,
        },
      ],
    },
    "humor-moment": {
      featured_title: "Julia unfiltered",
      featured_subtitle: "Warm, funny teaching moments Jockey found",
      rails: [
        {
          id: "asides",
          title: "Asides",
          subtitle: "Off-script Julia charm",
          startIndex: 4,
          endIndex: 7,
        },
        {
          id: "laughs",
          title: "Laughs",
          subtitle: "Audience moments and quips",
          startIndex: 8,
          endIndex: 11,
        },
        {
          id: "more-humor",
          title: "More Humor",
          subtitle: "Additional lighthearted beats",
          startIndex: 12,
          endIndex: 15,
        },
      ],
    },
  },
};

export function getSearchPresentation(
  storeKey: StoreKey,
  presetId: string,
): ExploreSearchPresentation | null {
  return SEARCH_PRESENTATION[storeKey]?.[presetId] ?? null;
}

/** Keywords used when ranking timeline beats per cached search preset. */
export const PRESET_SEARCH_KEYWORDS: Record<StoreKey, Record<string, string[]>> = {
  hells_kitchen: {
    "heated-argument": [
      "dinner",
      "service",
      "argument",
      "confrontation",
      "pass",
      "table",
      "kitchen",
      "blow",
      "ejected",
      "raw",
    ],
    "chef-confrontation": [
      "ramsay",
      "confrontation",
      "raw",
      "punishment",
      "yell",
      "insult",
      "donkey",
      "call out",
      "scold",
    ],
    "elimination-drama": [
      "elimination",
      "eliminated",
      "jacket",
      "ceremony",
      "bottom",
      "nomination",
      "sent home",
      "goodbye",
    ],
  },
  lizzie_bennet: {
    "awkward-dinner": ["dinner", "family", "awkward", "table", "bennet", "mrs", "tension"],
    "confession-cam": ["confession", "camera", "vlog", "direct", "emotional", "alone", "honest"],
    "romantic-tension": ["romantic", "tension", "love", "dm", "text", "glance", "party"],
  },
  omeleto_reserve: {
    "tense-silence": ["silence", "quiet", "pause", "wait", "still", "breath"],
    "dramatic-reveal": ["reveal", "twist", "turn", "surprise", "discover", "truth"],
    "emotional-climax": ["climax", "break", "cry", "emotion", "tear", "release"],
  },
  french_chef: {
    "knife-technique": ["knife", "cut", "julienne", "chop", "technique", "prep"],
    "sauce-demo": ["sauce", "wine", "reduction", "butter", "pan", "deglaze"],
    "humor-moment": ["funny", "laugh", "joke", "humor", "wine", "bon appetit"],
  },
};
