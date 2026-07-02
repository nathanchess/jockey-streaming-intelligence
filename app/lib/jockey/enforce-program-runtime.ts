import type { ProgramLineupItemRaw } from "../types";
import { formatTimestamp, parseBriefTargetMinutes, parseTimestamp } from "../types";

const RUNTIME_TOLERANCE = 0.1;
const DEFAULT_SLOT_MINUTES = 13;
const MIN_SLOT_MINUTES = 3;
const MAX_SLOT_MINUTES = 20;
const MAX_LINEUP_SLOTS = 24;

export function lineupSlotDurationMinutes(row: ProgramLineupItemRaw): number {
  const start = parseTimestamp(row.clip_start);
  const end = parseTimestamp(row.clip_end);
  const sec = Math.max(0, end - start);
  return Math.max(1, Math.round(sec / 60));
}

export function lineupTotalMinutes(lineup: ProgramLineupItemRaw[]): number {
  return lineup.reduce((sum, row) => sum + lineupSlotDurationMinutes(row), 0);
}

function slotDurationForTarget(targetMin: number, slotCount: number): number {
  const raw = Math.round(targetMin / Math.max(slotCount, 1));
  return Math.min(MAX_SLOT_MINUTES, Math.max(MIN_SLOT_MINUTES, raw));
}

function normalizeClipWindow(
  row: ProgramLineupItemRaw,
  slotMinutes: number,
  assetDurationSec?: number,
): ProgramLineupItemRaw {
  const startSec = parseTimestamp(row.clip_start);
  const maxEnd = assetDurationSec ?? startSec + slotMinutes * 60;
  const desiredEnd = startSec + slotMinutes * 60;
  const endSec = Math.min(desiredEnd, maxEnd);
  const actualMinutes = Math.max(1, Math.round((endSec - startSec) / 60));

  return {
    ...row,
    clip_end: formatTimestamp(endSec),
    duration_minutes: actualMinutes,
  };
}

function cloneSlotForExpansion(
  template: ProgramLineupItemRaw,
  position: number,
): ProgramLineupItemRaw {
  return {
    ...template,
    position,
    lead_in_note:
      position > template.position
        ? `Extends the block with another pass at "${template.title}" to preserve FAST pacing.`
        : template.lead_in_note,
  };
}

export function enforceProgramRuntime(
  lineup: ProgramLineupItemRaw[],
  brief: string,
  assetDurationSec: (assetReference: string) => number | undefined = () => undefined,
): { lineup: ProgramLineupItemRaw[]; total_runtime_minutes: number } {
  if (lineup.length === 0) {
    return { lineup, total_runtime_minutes: 0 };
  }

  const targetMin = parseBriefTargetMinutes(brief) ?? 90;
  const minTarget = targetMin * (1 - RUNTIME_TOLERANCE);
  const maxTarget = targetMin * (1 + RUNTIME_TOLERANCE);

  const plannedSlots = Math.max(
    lineup.length,
    Math.ceil(targetMin / DEFAULT_SLOT_MINUTES),
  );
  const slotMinutes = slotDurationForTarget(targetMin, plannedSlots);

  let working = lineup.map((row) =>
    normalizeClipWindow(row, slotMinutes, assetDurationSec(row.asset_reference)),
  );

  const templates = [...working];
  let position = working.length;

  while (lineupTotalMinutes(working) < minTarget && position < MAX_LINEUP_SLOTS) {
    const template = templates[(position - lineup.length) % templates.length];
    position += 1;
    working.push(
      normalizeClipWindow(
        cloneSlotForExpansion(template, position),
        slotMinutes,
        assetDurationSec(template.asset_reference),
      ),
    );
  }

  while (working.length > 1 && lineupTotalMinutes(working) > maxTarget) {
    working.pop();
  }

  const normalized = working.map((row, index) => ({ ...row, position: index + 1 }));
  const total = lineupTotalMinutes(normalized);

  return {
    lineup: normalized,
    total_runtime_minutes: total,
  };
}
