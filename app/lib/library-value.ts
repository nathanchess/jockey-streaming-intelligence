import type { DemoAsset } from "./types";
import { formatDurationLabel, formatTimestamp } from "./types";
export const ANALYST_HOURLY_USD = 75;
/** Minutes of analyst time per hour of source video to manually tag metadata */
export const MANUAL_MINUTES_PER_HOUR_VIDEO = 45;
/** Minutes to review Jockey-generated metadata per episode */
export const JOCKEY_REVIEW_MINUTES_PER_EPISODE = 4;

export type ValueRow = { label: string; value: string; detail?: string };

export type LibraryValueEstimate = {
  totalDurationSec: number;
  totalDurationLabel: string;
  analyzedCount: number;
  assetCount: number;
  manualHours: number;
  jockeyReviewHours: number;
  hoursSaved: number;
  moneySavedUsd: number;
  rows: ValueRow[];
};

export function computeLibraryValue(assets: DemoAsset[]): LibraryValueEstimate {
  const assetCount = assets.length;
  const analyzedCount = assets.filter((a) => a.jockey_v2).length;
  const totalDurationSec = assets.reduce((s, a) => s + a.duration_sec, 0);
  const videoHours = totalDurationSec / 3600;
  const manualHours = videoHours * (MANUAL_MINUTES_PER_HOUR_VIDEO / 60);
  const jockeyReviewHours = (analyzedCount * JOCKEY_REVIEW_MINUTES_PER_EPISODE) / 60;
  const hoursSaved = Math.max(0, manualHours - jockeyReviewHours);
  const moneySavedUsd = Math.round(hoursSaved * ANALYST_HOURLY_USD);

  const rows: ValueRow[] = [
    {
      label: "Indexed video",
      value: formatTimestamp(totalDurationSec),
      detail: `${assetCount} episodes at 1× watch time`,
    },
    {
      label: "Manual metadata effort",
      value: `${manualHours.toFixed(1)} hrs`,
      detail: `${MANUAL_MINUTES_PER_HOUR_VIDEO} min analyst time per hour of video @ $${ANALYST_HOURLY_USD}/hr`,
    },
    {
      label: "Jockey review time",
      value: `${jockeyReviewHours.toFixed(1)} hrs`,
      detail: `${JOCKEY_REVIEW_MINUTES_PER_EPISODE} min metadata review × ${analyzedCount} analyzed episodes`,
    },
    {
      label: "Time saved",
      value: `${hoursSaved.toFixed(1)} hrs`,
      detail: "Manual effort minus Jockey review",
    },
    {
      label: "Est. cost saved",
      value: `$${moneySavedUsd.toLocaleString()}`,
      detail: `Time saved × $${ANALYST_HOURLY_USD}/hr analyst rate`,
    },
  ];

  return {
    totalDurationSec,
    totalDurationLabel: formatDurationLabel(totalDurationSec),
    analyzedCount,
    assetCount,
    manualHours,
    jockeyReviewHours,
    hoursSaved,
    moneySavedUsd,
    rows,
  };
}
