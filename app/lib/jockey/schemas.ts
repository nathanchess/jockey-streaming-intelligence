export const HYDRATION_SCHEMA = {
  type: "object",
  properties: {
    assets: {
      type: "array",
      items: {
        type: "object",
        properties: {
          asset_reference: { type: "string" },
          title_suggested: { type: "string" },
          genre: { type: "array", items: { type: "string" } },
          mood: { type: "array", items: { type: "string" } },
          characters: { type: "array", items: { type: "string" } },
          scene_types: { type: "array", items: { type: "string" } },
          audio_events: { type: "array", items: { type: "string" } },
          topics: { type: "array", items: { type: "string" } },
          content_rating_signal: { type: "string" },
          summary: { type: "string" },
          cast_analysis: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                role: { type: "string" },
                description: { type: "string" },
              },
              required: ["name", "role", "description"],
            },
          },
          episode_timeline: {
            type: "array",
            items: {
              type: "object",
              properties: {
                timestamp_start: { type: "string" },
                timestamp_end: { type: "string" },
                label: { type: "string" },
                characters_present: { type: "array", items: { type: "string" } },
                emotional_arc: { type: "string" },
                action_description: { type: "string" },
              },
              required: [
                "timestamp_start",
                "timestamp_end",
                "label",
                "characters_present",
                "emotional_arc",
                "action_description",
              ],
            },
          },
          notable_scenes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                timestamp_start: { type: "string" },
                timestamp_end: { type: "string" },
                scene_description: { type: "string" },
              },
              required: ["label", "timestamp_start", "timestamp_end", "scene_description"],
            },
          },
          most_important_scene: {
            type: "object",
            properties: {
              timestamp_start: { type: "string" },
              timestamp_end: { type: "string" },
              title: { type: "string" },
              reasoning: { type: "string" },
            },
            required: ["timestamp_start", "timestamp_end", "title", "reasoning"],
          },
          scene_timestamps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                timestamp_start: { type: "string" },
              },
              required: ["label", "timestamp_start"],
            },
          },
        },
        required: ["asset_reference", "summary"],
      },
    },
  },
  required: ["assets"],
};

export const SEARCH_SCHEMA = {
  type: "object",
  properties: {
    query_interpretation: { type: "string" },
    total_results: { type: "integer" },
    results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          asset_reference: { type: "string" },
          timestamp_start: { type: "string" },
          timestamp_end: { type: "string" },
          scene_title: { type: "string" },
          description: { type: "string" },
          match_type: { type: "string" },
          relevance_score: { type: "string" },
          scene_description: { type: "string" },
          alignment_reasoning: { type: "string" },
          match_signals: { type: "array", items: { type: "string" } },
          tags: { type: "array", items: { type: "string" } },
          characters_present: { type: "array", items: { type: "string" } },
        },
        required: [
          "asset_reference",
          "timestamp_start",
          "timestamp_end",
          "scene_title",
          "description",
          "match_type",
          "relevance_score",
          "scene_description",
          "alignment_reasoning",
          "tags",
          "characters_present",
        ],
      },
    },
  },
  required: ["query_interpretation", "total_results", "results"],
};

export const DISCOVERY_SCHEMA = {
  type: "object",
  properties: {
    viewer_intent_interpretation: { type: "string" },
    recommended_rail: {
      type: "array",
      items: {
        type: "object",
        properties: {
          rank: { type: "integer" },
          asset_reference: { type: "string" },
          title: { type: "string" },
          clip_start: { type: "string" },
          clip_end: { type: "string" },
          rationale: { type: "string" },
          match_signals: { type: "array", items: { type: "string" } },
          audience_alignment_reasoning: { type: "string" },
          clip_label: { type: "string" },
          clip_description: { type: "string" },
          characters_present: { type: "array", items: { type: "string" } },
          sub_clip_focus: { type: "string" },
          matched_audience_interests: { type: "array", items: { type: "string" } },
          clip_length_minutes: { type: "integer" },
          avoided_themes: { type: "array", items: { type: "string" } },
          character_spotlight: { type: "array", items: { type: "string" } },
          audience_fit_score: { type: "integer" },
          interest_match_score: { type: "integer" },
          avoidance_score: { type: "integer" },
        },
        required: [
          "rank",
          "asset_reference",
          "title",
          "clip_start",
          "clip_end",
          "rationale",
          "match_signals",
          "audience_alignment_reasoning",
          "clip_label",
          "clip_description",
          "characters_present",
          "sub_clip_focus",
          "matched_audience_interests",
          "clip_length_minutes",
          "avoided_themes",
          "character_spotlight",
          "audience_fit_score",
          "interest_match_score",
          "avoidance_score",
        ],
      },
    },
  },
  required: ["viewer_intent_interpretation", "recommended_rail"],
};

export const PROGRAMMING_SCHEMA = {
  type: "object",
  properties: {
    channel_brief_interpretation: { type: "string" },
    lineup: {
      type: "array",
      items: {
        type: "object",
        properties: {
          position: { type: "integer" },
          asset_reference: { type: "string" },
          title: { type: "string" },
          clip_start: { type: "string" },
          clip_end: { type: "string" },
          duration_minutes: { type: "number" },
          programming_rationale: { type: "string" },
          lead_in_note: { type: "string" },
          lead_out_note: { type: "string" },
          jockey_reasoning: { type: "string" },
          audience_fit: { type: "string" },
        },
        required: [
          "position",
          "asset_reference",
          "title",
          "clip_start",
          "clip_end",
          "duration_minutes",
          "programming_rationale",
          "lead_in_note",
          "lead_out_note",
          "jockey_reasoning",
          "audience_fit",
        ],
      },
    },
    total_runtime_minutes: { type: "number" },
    programming_notes: { type: "string" },
  },
  required: [
    "channel_brief_interpretation",
    "lineup",
    "total_runtime_minutes",
    "programming_notes",
  ],
};

export const TOKEN_LIMITS: Record<string, number> = {
  metadata_hydration: 16384,
  semantic_search: 8192,
  personalized_discovery: 16384,
  fast_programming: 12288,
};
