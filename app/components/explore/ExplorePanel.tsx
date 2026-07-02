"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Banner,
  Button,
  HourglassIcon,
  SearchIcon,
  TextField,
  cn,
} from "@twelvelabs-io/react";
import type { ExploreLayout, ExploreBrowseLayout } from "@/lib/explore-layout";
import { buildDynamicSearchLayout, getExploreSectionLayout } from "@/lib/explore-layout";
import {
  JOCKEY_LOADING_MESSAGES,
  type ExploreSearchPresentation,
} from "@/lib/explore-search-presentation";
import type { ResolvedClip, StoreKey } from "@/lib/types";
import { FeaturedCarousel, CategoryRail } from "./ExploreResults";
import { ExploreDataModal, ExploreDataToggle } from "./ExploreDataPanel";
import { JockeySearchLoading } from "./JockeySearchLoading";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { PanelContentSkeleton } from "@/components/ui/PanelContentSkeleton";
import { TypewriterText } from "./TypewriterText";
import { fetchJson, assertResolvedClipsPayload } from "@/lib/api-response";
import { useDemoStore } from "@/store/demo-store";
import { useExploreStore } from "@/store/explore-store";
import { useErrorStore } from "@/store/error-store";

type Preset = { id: string; label: string; query: string };

type ExploreMode = "browse" | "search";

const MIN_JOCKEY_MS = 2400;
const MAX_JOCKEY_MS = 5200;

function jockeyLoadingDelayMs(): number {
  const roll = Math.random();
  if (roll < 0.35) {
    return MIN_JOCKEY_MS + Math.round(Math.random() * 600);
  }
  return MIN_JOCKEY_MS + Math.round(Math.random() * (MAX_JOCKEY_MS - MIN_JOCKEY_MS));
}

type SearchPayload = {
  source: "cache" | "live";
  endpoint: string;
  mode?: ExploreMode;
  session_id?: string;
  request: unknown;
  response: {
    query_interpretation?: string;
    total_results?: number;
  };
  resolved_clips: ResolvedClip[];
  follow_ups?: Array<{ id: string; label: string }>;
  explore_presentation?: ExploreSearchPresentation;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ExplorePanel({
  storeKey,
  presets,
  layout,
  storeDisplayName,
}: {
  storeKey: StoreKey;
  presets: Preset[];
  layout: ExploreLayout;
  storeDisplayName: string;
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [clips, setClips] = useState<ResolvedClip[]>([]);
  const [followUps, setFollowUps] = useState<Array<{ id: string; label: string }>>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [mode, setMode] = useState<ExploreMode>("browse");
  const [isLive, setIsLive] = useState(false);
  const [interpretation, setInterpretation] = useState<string>("");
  const [searchPresentation, setSearchPresentation] = useState<ExploreSearchPresentation | null>(
    null,
  );
  const setLastApiExchange = useDemoStore((s) => s.setLastApiExchange);
  const lastApiExchange = useDemoStore((s) => s.lastApiExchange);
  const setActiveQueryId = useExploreStore((s) => s.setActiveQueryId);
  const setLiveSessionId = useExploreStore((s) => s.setLiveSessionId);
  const [focused, setFocused] = useState(false);
  const [dataViewOpen, setDataViewOpen] = useState(false);
  const liveSessionId = useExploreStore((s) => s.liveSessionId);
  const showError = useErrorStore((s) => s.showError);

  const loadingMessages = JOCKEY_LOADING_MESSAGES[storeKey];

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
    (data: SearchPayload, queryId?: string, nextMode: ExploreMode = "search") => {
      setClips(Array.isArray(data.resolved_clips) ? data.resolved_clips : []);
      setFollowUps(data.follow_ups ?? []);
      setIsLive(data.source === "live");
      setMode(data.mode ?? nextMode);
      setInterpretation(data.response.query_interpretation ?? "");
      setSearchPresentation(data.explore_presentation ?? null);
      setLastApiExchange({
        endpoint: data.endpoint,
        source: data.source,
        request: data.request,
        response: data.response,
        session_id: data.session_id,
      });
      if (data.session_id && data.source === "live") setLiveSessionId(data.session_id);
      if (queryId) setActiveQueryId(queryId);
    },
    [setLastApiExchange, setActiveQueryId, setLiveSessionId],
  );

  const runJockeySearch = useCallback(
    async (
      fetchResults: () => Promise<SearchPayload>,
      options: { queryId?: string; fillQuery?: string; presetId?: string | null } = {},
    ) => {
      setLoading(true);
      setActivePresetId(options.presetId ?? null);
      if (options.fillQuery !== undefined) setQuery(options.fillQuery);
      const started = Date.now();
      const minDelay = jockeyLoadingDelayMs();
      try {
        const data = await fetchResults();
        const elapsed = Date.now() - started;
        if (elapsed < minDelay) await wait(minDelay - elapsed);
        applyPayload(data, options.queryId, "search");
      } catch (err) {
        showError(err instanceof Error ? err.message : undefined);
      } finally {
        setLoading(false);
      }
    },
    [applyPayload, showError],
  );

  const loadBrowse = useCallback(async () => {
    setActivePresetId(null);
    setQuery("");
    setSearchPresentation(null);
    setInitialLoading(true);
    try {
      const data = await fetchJson<SearchPayload>(`/api/cache/${storeKey}/explore/default`);
      assertResolvedClipsPayload(data);
      applyPayload(data, undefined, "browse");
    } catch (err) {
      showError(err instanceof Error ? err.message : undefined);
    } finally {
      setInitialLoading(false);
    }
  }, [storeKey, applyPayload, showError]);

  const loadPreset = (presetId: string, fillQuery = false) => {
    const preset = presets.find((p) => p.id === presetId);
    return runJockeySearch(
      async () => {
        const data = await fetchJson<SearchPayload>(
          `/api/cache/${storeKey}/search/${presetId}`,
        );
        assertResolvedClipsPayload(data);
        return data;
      },
      {
        queryId: presetId,
        presetId,
        fillQuery: fillQuery && preset ? preset.label : undefined,
      },
    );
  };

  const runLiveSearch = (q: string, sessionId?: string) =>
    runJockeySearch(
      async () => {
        const data = await fetchJson<SearchPayload>("/api/jockey/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeKey, query: q, sessionId }),
        });
        assertResolvedClipsPayload(data);
        return data;
      },
      { presetId: null },
    );

  const onSearch = () => {
    const trimmed = query.trim();
    if (!trimmed || loading) return;
    const preset = presets.find(
      (p) =>
        p.label.toLowerCase() === trimmed.toLowerCase() ||
        p.query.toLowerCase() === trimmed.toLowerCase(),
    );
    if (preset) {
      void loadPreset(preset.id, true);
      return;
    }
    void runLiveSearch(trimmed, liveSessionId ?? undefined);
  };

  const onSuggestedPrompt = (presetId: string) => {
    void loadPreset(presetId, true);
  };

  const onFollowUp = async (followUpId: string) => {
    if (!activePresetId) return;
    await runJockeySearch(
      async () => {
        const data = await fetchJson<SearchPayload>(
          `/api/cache/${storeKey}/search/${activePresetId}/follow-up/${followUpId}`,
        );
        assertResolvedClipsPayload(data);
        return data;
      },
      { queryId: activePresetId, presetId: activePresetId },
    );
  };

  const onResetBrowse = () => {
    void loadBrowse();
  };

  useEffect(() => {
    void loadBrowse();
  }, [loadBrowse]);

  const defaultSectionLayout = getExploreSectionLayout(layout, mode);
  const liveSearchLayout =
    mode === "search" && isLive && !searchPresentation && clips.length > 0
      ? buildDynamicSearchLayout(
          clips.length,
          interpretation || "Featured pick",
          `Top matches for "${query || "your search"}" across ${storeDisplayName}`,
        )
      : null;
  const sectionLayout: ExploreBrowseLayout =
    mode === "search" && searchPresentation
      ? {
          featured: {
            title: searchPresentation.featured_title,
            subtitle: searchPresentation.featured_subtitle,
            slideCount: defaultSectionLayout.featured.slideCount,
          },
          rails: searchPresentation.rails,
        }
      : liveSearchLayout ?? defaultSectionLayout;

  const featuredClips = clips.slice(0, sectionLayout.featured.slideCount);
  const showTypewriterPlaceholder = !query && !focused && mode === "browse" && !loading;

  const featuredTitle =
    mode === "browse"
      ? sectionLayout.featured.title
      : searchPresentation?.featured_title ?? interpretation ?? sectionLayout.featured.title;
  const featuredSubtitle =
    mode === "browse"
      ? sectionLayout.featured.subtitle
      : searchPresentation?.featured_subtitle ??
        `Top matches for "${query || "your search"}" across ${storeDisplayName}`;

  return (
    <div>
      <div
        className={cn(
          "explore-intro-search mx-auto mb-4 flex max-w-2xl items-stretch gap-2",
        )}
      >
        <div
          className={cn(
            "min-w-0 flex-1 rounded-2xl",
            focused && "search-bar-shell search-bar-shell--focused",
          )}
        >
          <div
            data-search
            className="relative flex items-center gap-2 rounded-2xl border border-border-secondary bg-surface-white p-2"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          >
          {showTypewriterPlaceholder && (
            <div
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center pr-28 text-sm text-foreground-subtle"
              aria-hidden
            >
              <SearchIcon className="mr-2 size-4 shrink-0 opacity-60" />
              <TypewriterText texts={layout.typewriterQueries} speed={36} pauseMs={1800} />
            </div>
          )}
          <TextField
            className="flex-1 border-0 bg-transparent shadow-none"
            placeholder=""
            aria-label="Search query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
          <Button
            variant="primary"
            size="md"
            className="shrink-0 self-center"
            onClick={onSearch}
            disabled={loading || !query.trim()}
          >
            {loading ? (
              <HourglassIcon className="size-4 animate-pulse" />
            ) : (
              <>
                <SearchIcon className="size-4" />
                Search
              </>
            )}
          </Button>
        </div>
        </div>
        <ExploreDataToggle
          open={dataViewOpen}
          onToggle={() => setDataViewOpen((open) => !open)}
          disabled={clips.length === 0 || loading}
          className="self-center"
        />
      </div>

      <ExploreDataModal
        open={dataViewOpen && !loading}
        onClose={() => setDataViewOpen(false)}
        storeKey={storeKey}
        mode={mode}
        query={query}
        presetId={activePresetId}
        interpretation={interpretation}
        clips={clips}
        exchange={lastApiExchange}
      />

      <div className="explore-intro-rest">
        <div className="mb-8 flex flex-wrap justify-center gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.id}
                type="button"
                variant={activePresetId === preset.id ? "primary" : "outlined-gray"}
                size="sm"
                disabled={loading}
                data-testid={`explore-search-chip-${preset.id}`}
                onClick={() => onSuggestedPrompt(preset.id)}
              >
                <SearchIcon className="size-3.5" />
                {preset.label}
              </Button>
            ))}
            {mode === "search" && !loading && (
              <Button type="button" variant="ghosted" size="sm" onClick={onResetBrowse}>
                Back to highlights
              </Button>
            )}
          </div>

          {isLive && !loading && (
            <Banner className="mb-6" variant="info">
              Live Jockey query — results from POST /responses
            </Banner>
          )}

          {!loading && mode === "search" && clips.length === 0 && (
            <Banner className="mb-6" variant="warning">
              Jockey returned results, but none could be matched to playable clips in this library.
            </Banner>
          )}

          {initialLoading ? (
            <PanelContentSkeleton variant="explore" />
          ) : loading ? (
            <JockeySearchLoading seriesName={storeDisplayName} message={loadingMessage} />
          ) : (
            <>
              {featuredClips.length > 0 && (
                <RevealOnScroll className="mb-8">
                  <div className="mb-4">
                    <h2 className="text-lg font-normal">{featuredTitle}</h2>
                    <p className="mt-1 text-sm text-foreground-subtle">{featuredSubtitle}</p>
                  </div>
                  <FeaturedCarousel clips={featuredClips} />
                </RevealOnScroll>
              )}

              {followUps.length > 0 && mode === "search" && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {followUps.map((f) => (
                    <Button
                      key={f.id}
                      type="button"
                      variant="outlined-gray"
                      size="sm"
                      onClick={() => onFollowUp(f.id)}
                    >
                      <SearchIcon className="size-3.5" />
                      {f.label}
                    </Button>
                  ))}
                </div>
              )}

              {sectionLayout.rails.map((rail) => {
                const railClips = clips.slice(rail.startIndex, rail.endIndex + 1);
                return (
                  <CategoryRail
                    key={rail.id}
                    railId={rail.id}
                    title={rail.title}
                    subtitle={rail.subtitle}
                    clips={railClips}
                  />
                );
              })}
            </>
          )}
      </div>
    </div>
  );
}
