import type { DiscoverRailItemRaw, ResolvedClip } from "./types";
import type { PersonalizationConfig } from "./personalization-config";

export type PersonalizationFitScores = {
  audienceFit: number;
  interestMatch: number;
  avoidanceConfidence: number;
};

export type PersonalizationClipMetadata = {
  clipDescription: string;
  reasoning: string;
  matchedAudienceInterests: string[];
  clipLengthMin: number;
  avoidedThemes: string[];
  characterSpotlight: string[];
  fitScores: PersonalizationFitScores;
};

function clipLengthMinutes(startSec: number, endSec: number): number {
  return Math.max(1, Math.round(Math.abs(endSec - startSec) / 60));
}

function pickMatchedInterests(
  config: PersonalizationConfig,
  signals: string[] | undefined,
): string[] {
  const fromConfig = config.lookingFor.filter(Boolean);
  if (fromConfig.length >= 2) {
    return fromConfig.slice(0, 3);
  }
  return (signals ?? []).slice(0, 3);
}

function pickCharacterSpotlight(
  config: PersonalizationConfig,
  characters: string[] | undefined,
  spotlightFromRaw: string[] | undefined,
): string[] {
  if (spotlightFromRaw?.length) return spotlightFromRaw;
  const preferred = config.characterSpotlight.filter(Boolean);
  const present = characters ?? [];
  const matched = preferred.filter((name) =>
    present.some((p) => p.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(p.toLowerCase())),
  );
  if (matched.length > 0) return matched.slice(0, 4);
  if (preferred.length > 0) return preferred.slice(0, 4);
  return present.slice(0, 4);
}

function defaultFitScores(rank: number): PersonalizationFitScores {
  const audienceFit = Math.max(74, 97 - (rank - 1) * 2);
  return {
    audienceFit,
    interestMatch: Math.max(70, audienceFit - 4),
    avoidanceConfidence: Math.max(78, audienceFit - 6),
  };
}

export function buildPersonalizationClipMetadata(
  clip: ResolvedClip,
  config: PersonalizationConfig,
  raw?: Partial<DiscoverRailItemRaw>,
): PersonalizationClipMetadata {
  const rank = clip.rank ?? raw?.rank ?? 5;
  const defaults = defaultFitScores(rank);

  return {
    clipDescription:
      raw?.clip_description ??
      clip.sceneDescription ??
      clip.description ??
      clip.subClipFocus ??
      "",
    reasoning:
      raw?.audience_alignment_reasoning ??
      clip.audienceAlignmentReasoning ??
      "",
    matchedAudienceInterests:
      raw?.matched_audience_interests ??
      pickMatchedInterests(config, clip.matchSignals),
    clipLengthMin:
      raw?.clip_length_minutes ?? clipLengthMinutes(clip.startSec, clip.endSec),
    avoidedThemes:
      raw?.avoided_themes ??
      (config.negativeTargeting.length > 0
        ? config.negativeTargeting.slice(0, 4)
        : ["off-profile themes"]),
    characterSpotlight: pickCharacterSpotlight(
      config,
      clip.charactersPresent,
      raw?.character_spotlight,
    ),
    fitScores: {
      audienceFit: raw?.audience_fit_score ?? defaults.audienceFit,
      interestMatch: raw?.interest_match_score ?? defaults.interestMatch,
      avoidanceConfidence: raw?.avoidance_score ?? defaults.avoidanceConfidence,
    },
  };
}

export function enrichClipsWithPersonalizationMetadata(
  clips: ResolvedClip[],
  config: PersonalizationConfig,
): ResolvedClip[] {
  return clips.map((clip) => ({
    ...clip,
    personalizationMetadata:
      clip.personalizationMetadata ?? buildPersonalizationClipMetadata(clip, config),
  }));
}
