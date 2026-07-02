"use client";

import { useState } from "react";
import { ToggleButton, ToggleButtons } from "@twelvelabs-io/react";
import { MatchSignalsChips } from "./ReasoningPanel";

type Tab = "overview" | "why";

export function ClipDetailTabs({
  overview,
  sceneDescription,
  alignmentReasoning,
  matchSignals,
}: {
  overview: React.ReactNode;
  sceneDescription?: string;
  alignmentReasoning?: string;
  matchSignals?: string[];
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const hasWhy = Boolean(sceneDescription || alignmentReasoning || matchSignals?.length);

  return (
    <div>
      {hasWhy && (
        <ToggleButtons
          value={tab}
          onValueChange={(v) => setTab(v as Tab)}
          gap
          className="mb-3"
        >
          <ToggleButton value="overview">
            Overview
          </ToggleButton>
          <ToggleButton value="why" data-testid="clip-detail-why-tab">
            Why it matches
          </ToggleButton>
        </ToggleButtons>
      )}
      {tab === "overview" || !hasWhy ? (
        overview
      ) : (
        <div className="space-y-2 text-sm">
          {sceneDescription && (
            <p className="text-foreground-secondary">{sceneDescription}</p>
          )}
          {alignmentReasoning && (
            <p className="rounded-lg border border-border-secondary bg-surface-muted p-2 break-words text-foreground-body">
              {alignmentReasoning}
            </p>
          )}
          <MatchSignalsChips signals={matchSignals} />
        </div>
      )}
    </div>
  );
}
