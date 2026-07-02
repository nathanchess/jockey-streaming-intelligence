import type { ViewerProfileId } from "./types";

export type PersonalizationConfig = {
  lookingFor: string[];
  maxClipLengthMin: number;
  negativeTargeting: string[];
  characterSpotlight: string[];
};

export const PERSONALIZATION_PROFILES: Record<ViewerProfileId, PersonalizationConfig> = {
  feel_good_family: {
    lookingFor: ["feel-good content", "family-friendly", "uplifting moments"],
    maxClipLengthMin: 20,
    negativeTargeting: ["violence", "harsh language", "elimination drama"],
    characterSpotlight: ["Gordon Ramsay", "uplifting contestants"],
  },
  suspense_seeker: {
    lookingFor: ["tense scenes", "strong female lead", "dramatic reveals"],
    maxClipLengthMin: 30,
    negativeTargeting: ["feel-good filler", "slow pacing", "light comedy"],
    characterSpotlight: ["Gordon Ramsay", "high-stakes contestants"],
  },
  fast_programmer: {
    lookingFor: ["prime-time competition energy", "18-34 female demo", "90-min drama block"],
    maxClipLengthMin: 90,
    negativeTargeting: ["slow burns", "standalone episodes", "low-energy beats"],
    characterSpotlight: ["Gordon Ramsay", "competition front-runners"],
  },
};

export function clonePersonalizationConfig(config: PersonalizationConfig): PersonalizationConfig {
  return {
    lookingFor: [...config.lookingFor],
    maxClipLengthMin: config.maxClipLengthMin,
    negativeTargeting: [...config.negativeTargeting],
    characterSpotlight: [...config.characterSpotlight],
  };
}

export function configsEqual(a: PersonalizationConfig, b: PersonalizationConfig): boolean {
  return (
    a.maxClipLengthMin === b.maxClipLengthMin &&
    a.lookingFor.length === b.lookingFor.length &&
    a.negativeTargeting.length === b.negativeTargeting.length &&
    a.characterSpotlight.length === b.characterSpotlight.length &&
    a.lookingFor.every((item, i) => item === b.lookingFor[i]) &&
    a.negativeTargeting.every((item, i) => item === b.negativeTargeting[i]) &&
    a.characterSpotlight.every((item, i) => item === b.characterSpotlight[i])
  );
}

/** Natural-language intent sent to Jockey discover API. */
export function configToIntent(config: PersonalizationConfig): string {
  const looking = config.lookingFor.filter(Boolean).join(", ");
  const exclude = config.negativeTargeting.filter(Boolean);
  const spotlight = config.characterSpotlight.filter(Boolean);
  const excludePhrase =
    exclude.length > 0 ? ` Negative targeting: exclude ${exclude.join(", ")}.` : "";
  const spotlightPhrase =
    spotlight.length > 0 ? ` Character spotlight: ${spotlight.join(", ")}.` : "";
  return `Looking for ${looking}, under ${config.maxClipLengthMin} min per clip.${excludePhrase}${spotlightPhrase}`;
}
