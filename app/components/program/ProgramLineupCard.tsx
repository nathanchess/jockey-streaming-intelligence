"use client";

import {
  AnalyzeIcon,
  ArrowBoxRightIcon,
  Button,
  CalendarIcon,
  ChevronDownIcon,
  cn,
  PlayBoxedIcon,
  ProfileIcon,
} from "@twelvelabs-io/react";
import type { ProgramLineupItemRaw, ResolvedClip } from "@/lib/types";
import { ClipPreviewVideo } from "@/components/explore/ClipPreviewVideo";

function ReasoningBlock({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof AnalyzeIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border-secondary/70 bg-surface-white p-3 min-w-0">
      <div className="mb-1.5 flex items-center gap-2">
        <Icon className="size-3.5 shrink-0 text-foreground-subtle" />
        <p className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">
          {title}
        </p>
      </div>
      <p className="min-w-0 text-sm leading-relaxed break-words text-foreground-secondary">{description}</p>
    </div>
  );
}

function TransitionNote({
  label,
  note,
}: {
  label: string;
  note: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 gap-2 rounded-lg bg-surface-white/80 px-3 py-2">
      <ArrowBoxRightIcon className="mt-0.5 size-3.5 shrink-0 text-foreground-subtle" />
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-foreground-subtle">
          {label}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-foreground-secondary">{note}</p>
      </div>
    </div>
  );
}

export function ProgramLineupReasoning({ row }: { row: ProgramLineupItemRaw }) {
  return (
    <div className="border-t border-border-secondary bg-surface-muted/40 px-4 pb-4 pt-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <ReasoningBlock
          icon={CalendarIcon}
          title="Programming rationale"
          description={row.programming_rationale}
        />
        {row.jockey_reasoning && (
          <ReasoningBlock
            icon={AnalyzeIcon}
            title="Jockey reasoning"
            description={row.jockey_reasoning}
          />
        )}
        {row.audience_fit && (
          <ReasoningBlock
            icon={ProfileIcon}
            title="Audience fit"
            description={row.audience_fit}
          />
        )}
      </div>

      {(row.lead_in_note || row.lead_out_note) && (
        <div className="mt-3 flex flex-col gap-2 border-t border-border-secondary/60 pt-3 sm:flex-row">
          {row.lead_in_note && <TransitionNote label="Lead-in" note={row.lead_in_note} />}
          {row.lead_out_note && <TransitionNote label="Lead-out" note={row.lead_out_note} />}
        </div>
      )}
    </div>
  );
}

export function ProgramLineupCard({
  row,
  clip,
  expanded,
  onToggleReasoning,
  onPlay,
}: {
  row: ProgramLineupItemRaw;
  clip?: ResolvedClip;
  expanded: boolean;
  onToggleReasoning: () => void;
  onPlay: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border-secondary bg-surface-white">
      <div className="flex gap-4 p-4">
        {clip && (
          <Button
            type="button"
            variant="ghosted"
            className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg p-0 hover:bg-transparent"
            data-testid="program-lineup-thumb"
            onClick={onPlay}
          >
            <ClipPreviewVideo
              clip={clip}
              className="absolute inset-0"
              hoverPlay={false}
              active
            />
            <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100">
              <PlayBoxedIcon className="size-6 text-white" />
            </span>
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <span className="font-tl-mono text-lg text-foreground-subtle">
              {String(row.position).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{row.title}</p>
              <p className="mt-1 font-tl-mono text-xs text-foreground-subtle">
                {row.clip_start} – {row.clip_end} · {row.duration_minutes} min
              </p>
            </div>
            <Button
              variant="outlined-gray"
              size="sm"
              data-testid="program-reasoning-toggle"
              onClick={onToggleReasoning}
              aria-expanded={expanded}
            >
              {expanded ? "Hide reasoning" : "View reasoning"}
              <ChevronDownIcon
                className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
              />
            </Button>
          </div>
        </div>
      </div>

      {expanded && <ProgramLineupReasoning row={row} />}
    </div>
  );
}
