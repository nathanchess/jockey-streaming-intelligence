"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AnalyzeIcon,
  Banner,
  Button,
  Chip,
  HourglassIcon,
  Text,
  TextArea,
} from "@twelvelabs-io/react";
import type { ProgramCachePayload, ProgramLineupItemRaw, ResolvedClip, StoreKey } from "@/lib/types";
import { parseBriefTargetMinutes } from "@/lib/types";
import { JockeySearchLoading } from "@/components/explore/JockeySearchLoading";
import { JOCKEY_PROGRAM_LOADING_MESSAGES } from "@/lib/explore-search-presentation";
import { ProgramLineupCard } from "@/components/program/ProgramLineupCard";
import { ProgramLineupConnector } from "@/components/program/ProgramLineupConnector";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { PanelContentSkeleton } from "@/components/ui/PanelContentSkeleton";
import { fetchJson, assertProgramPayload } from "@/lib/api-response";
import { useDemoStore } from "@/store/demo-store";
import { usePlayerStore } from "@/store/player-store";
import { useErrorStore } from "@/store/error-store";

type ProgramPayload = ProgramCachePayload & {
  source: "cache" | "live";
  endpoint: string;
  brief?: string;
  session_id?: string;
};

const MIN_JOCKEY_MS = 2400;
const MAX_JOCKEY_MS = 5200;

function jockeyLoadingDelayMs(): number {
  const roll = Math.random();
  if (roll < 0.35) {
    return MIN_JOCKEY_MS + Math.round(Math.random() * 600);
  }
  return MIN_JOCKEY_MS + Math.round(Math.random() * (MAX_JOCKEY_MS - MIN_JOCKEY_MS));
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ProgramPanel({
  storeKey,
  storeDisplayName,
}: {
  storeKey: StoreKey;
  storeDisplayName: string;
}) {
  const [brief, setBrief] = useState("");
  const [defaultBrief, setDefaultBrief] = useState("");
  const [lineup, setLineup] = useState<ProgramLineupItemRaw[]>([]);
  const [totalRuntime, setTotalRuntime] = useState(0);
  const [notes, setNotes] = useState("");
  const [clips, setClips] = useState<ResolvedClip[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [expandedSlots, setExpandedSlots] = useState<Set<number>>(new Set());
  const setLastApiExchange = useDemoStore((s) => s.setLastApiExchange);
  const openClip = usePlayerStore((s) => s.openClip);
  const showError = useErrorStore((s) => s.showError);

  const loadingMessages = JOCKEY_PROGRAM_LOADING_MESSAGES[storeKey];

  useEffect(() => {
    if (!loading) return;
    let index = 0;
    setLoadingMessage(loadingMessages[index % loadingMessages.length]);
    const id = window.setInterval(() => {
      index += 1;
      setLoadingMessage(loadingMessages[index % loadingMessages.length]);
    }, 2200);
    return () => window.clearInterval(id);
  }, [loading, loadingMessages]);

  const applyPayload = useCallback(
    (data: ProgramPayload) => {
      const resp = data.response;
      setLineup(resp.lineup ?? []);
      setTotalRuntime(resp.total_runtime_minutes ?? 0);
      setNotes(resp.programming_notes ?? "");
      setClips(Array.isArray(data.resolved_clips) ? data.resolved_clips : []);
      setIsLive(data.source === "live");
      setExpandedSlots(new Set());
      setLastApiExchange({
        endpoint: data.endpoint,
        source: data.source,
        request: data.request,
        response: data.response,
        session_id: data.session_id,
      });
    },
    [setLastApiExchange],
  );

  const loadDefault = useCallback(async () => {
    setInitialLoading(true);
    try {
      const data = await fetchJson<ProgramPayload & { brief: string }>(
        `/api/cache/${storeKey}/program/default`,
      );
      assertProgramPayload(data);
      setBrief(data.brief);
      setDefaultBrief(data.brief);
      applyPayload(data);
    } catch (err) {
      showError(err instanceof Error ? err.message : undefined);
    } finally {
      setInitialLoading(false);
    }
  }, [storeKey, applyPayload, showError]);

  useEffect(() => {
    void loadDefault();
  }, [loadDefault]);

  const runProgramming = useCallback(
    async (fetchResults: () => Promise<ProgramPayload>) => {
      setLoading(true);
      const started = Date.now();
      const minDelay = jockeyLoadingDelayMs();
      try {
        const data = await fetchResults();
        const elapsed = Date.now() - started;
        if (elapsed < minDelay) await wait(minDelay - elapsed);
        applyPayload(data);
      } catch (err) {
        showError(err instanceof Error ? err.message : undefined);
      } finally {
        setLoading(false);
      }
    },
    [applyPayload, showError],
  );

  const runLive = async () => {
    await runProgramming(async () => {
      const data = await fetchJson<ProgramPayload>("/api/jockey/program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeKey, brief }),
      });
      assertProgramPayload(data);
      return data;
    });
  };

  const onRun = () => {
    if (brief.trim() === defaultBrief.trim()) {
      void runProgramming(async () => {
        const data = await fetchJson<ProgramPayload & { brief: string }>(
          `/api/cache/${storeKey}/program/default`,
        );
        assertProgramPayload(data);
        setBrief(data.brief);
        setDefaultBrief(data.brief);
        return data;
      });
      return;
    }
    void runLive();
  };

  const exportJson = () => {
    const payload = {
      channel_brief: brief,
      lineup,
      total_runtime_minutes: totalRuntime,
      programming_notes: notes,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${storeKey}-lineup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const allReasoningExpanded =
    lineup.length > 0 && expandedSlots.size === lineup.length;

  const toggleSlotReasoning = useCallback((position: number) => {
    setExpandedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(position)) next.delete(position);
      else next.add(position);
      return next;
    });
  }, []);

  const toggleAllReasoning = useCallback(() => {
    setExpandedSlots((prev) => {
      if (lineup.length > 0 && prev.size === lineup.length) return new Set();
      return new Set(lineup.map((row) => row.position));
    });
  }, [lineup]);

  const targetMin = parseBriefTargetMinutes(brief);
  const runtimeOnTarget =
    targetMin !== null &&
    totalRuntime > 0 &&
    Math.abs(totalRuntime - targetMin) / targetMin <= 0.1;

  return (
    <div>
      <div className="mb-4">
        <Text as="label" variant="paragraph-small" className="mb-2 block text-foreground-secondary">
          FAST channel brief
        </Text>
        <TextArea
          purpose="embedding"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          controlClassName="min-h-[100px] py-4 pl-4 pr-4 shadow-none"
          textareaClassName="text-sm"
        />
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button variant="outlined-gray" onClick={() => loadDefault()} disabled={loading}>
          Load default brief
        </Button>
        <Button variant="primary" onClick={onRun} disabled={loading}>
          {loading ? <HourglassIcon className="size-4 animate-pulse" /> : "Generate lineup"}
        </Button>
        <Button
          variant="secondary"
          data-testid="program-export-json"
          onClick={exportJson}
          disabled={!lineup?.length || loading}
        >
          Export JSON
        </Button>
        {lineup.length > 0 && !loading && (
          <Button
            variant="outlined-gray"
            className="ml-auto"
            data-testid="program-view-all-reasoning"
            onClick={toggleAllReasoning}
          >
            <AnalyzeIcon className="size-4" />
            {allReasoningExpanded ? "Hide all" : "View all"}
          </Button>
        )}
      </div>

      {isLive && !loading && (
        <Banner variant="info" className="mb-4">
          Live Jockey programming response
        </Banner>
      )}

      {!loading && lineup.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <Chip variant="gray-outline" mono>
            {totalRuntime} min total
          </Chip>
          {targetMin !== null && (
            <Chip variant={runtimeOnTarget ? "success" : "warning"} mono>
              {runtimeOnTarget ? "Runtime on target" : `Target ${targetMin} min (±10%)`}
            </Chip>
          )}
        </div>
      )}

      {initialLoading ? (
        <PanelContentSkeleton variant="program" />
      ) : loading ? (
        <JockeySearchLoading seriesName={storeDisplayName} message={loadingMessage} />
      ) : (
        <>
          <div data-testid="program-lineup">
            {(lineup ?? []).map((row, i) => {
              const clip = clips[i];
              const expanded = expandedSlots.has(row.position);
              return (
                <div key={row.position}>
                  <RevealOnScroll staggerIndex={i}>
                    <ProgramLineupCard
                      row={row}
                      clip={clip}
                      expanded={expanded}
                      onToggleReasoning={() => toggleSlotReasoning(row.position)}
                      onPlay={() =>
                        clip &&
                        openClip({
                          videoSrc: clip.videoSrc,
                          startSec: clip.startSec,
                          endSec: clip.endSec,
                          title: row.title,
                          posterUrl: clip.thumbnailUrl,
                        })
                      }
                    />
                  </RevealOnScroll>
                  {i < lineup.length - 1 && <ProgramLineupConnector />}
                </div>
              );
            })}
          </div>
          {notes && (
            <p className="mt-4 break-words text-sm leading-relaxed text-foreground-secondary">{notes}</p>
          )}
        </>
      )}
    </div>
  );
}
