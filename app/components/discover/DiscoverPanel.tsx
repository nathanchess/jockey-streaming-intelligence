"use client";



import { useCallback, useEffect, useState } from "react";

import {

  AnalyzeIcon,

  Banner,

  Button,

  HourglassIcon,

  ToggleButton,

  ToggleButtons,

} from "@twelvelabs-io/react";

import type { ApiExchange, ResolvedClip, StoreKey, ViewerProfileId } from "@/lib/types";

import { VIEWER_PROFILES } from "@/lib/types";

import { JockeySearchLoading } from "@/components/explore/JockeySearchLoading";

import { JOCKEY_LOADING_MESSAGES } from "@/lib/explore-search-presentation";

import { enrichClipsWithPersonalizationMetadata } from "@/lib/personalization-clip-metadata";

import {

  clonePersonalizationConfig,

  configToIntent,

  configsEqual,

  PERSONALIZATION_PROFILES,

  type PersonalizationConfig,

} from "@/lib/personalization-config";

import type { StoreCharacterOption } from "@/lib/store-characters";

import { PersonalizationConfigTable } from "@/components/discover/PersonalizationConfigTable";

import {

  PersonalizationDataModal,

  PersonalizationDataToggle,

} from "@/components/discover/PersonalizationDataPanel";

import { DiscoverClipCard } from "@/components/discover/DiscoverClipCard";

import { DiscoverRail } from "@/components/discover/DiscoverRail";

import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

import { PanelContentSkeleton } from "@/components/ui/PanelContentSkeleton";

import { fetchJson, assertResolvedClipsPayload } from "@/lib/api-response";

import { useDemoStore } from "@/store/demo-store";

import { useErrorStore } from "@/store/error-store";



type DiscoverPayload = {

  source: "cache" | "live";

  endpoint: string;

  request: unknown;

  response: {

    viewer_intent_interpretation?: string;

  };

  resolved_clips: ResolvedClip[];

  intent?: string;

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



export function DiscoverPanel({

  storeKey,

  storeDisplayName,

  storeCharacters,

}: {

  storeKey: StoreKey;

  storeDisplayName: string;

  storeCharacters: StoreCharacterOption[];

}) {

  const viewerProfileId = useDemoStore((s) => s.viewerProfileId);

  const setViewerProfileId = useDemoStore((s) => s.setViewerProfileId);

  const setLastApiExchange = useDemoStore((s) => s.setLastApiExchange);

  const lastApiExchange = useDemoStore((s) => s.lastApiExchange);

  const [config, setConfig] = useState<PersonalizationConfig>(() =>

    clonePersonalizationConfig(PERSONALIZATION_PROFILES.feel_good_family),

  );

  const [cachedConfigs, setCachedConfigs] = useState<

    Partial<Record<ViewerProfileId, PersonalizationConfig>>

  >({});

  const [clips, setClips] = useState<ResolvedClip[]>([]);

  const [loading, setLoading] = useState(false);

  const [loadingMessage, setLoadingMessage] = useState("");

  const [isLive, setIsLive] = useState(false);

  const [source, setSource] = useState<"cache" | "live">("cache");

  const [railKey, setRailKey] = useState(0);

  const [hasLoaded, setHasLoaded] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);

  const [viewerIntentInterpretation, setViewerIntentInterpretation] = useState("");
  const [dataViewOpen, setDataViewOpen] = useState(false);

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

    (data: DiscoverPayload, activeConfig: PersonalizationConfig) => {

      const enriched = enrichClipsWithPersonalizationMetadata(

        Array.isArray(data.resolved_clips) ? data.resolved_clips : [],

        activeConfig,

      );

      setClips(enriched);

      setIsLive(data.source === "live");

      setViewerIntentInterpretation(data.response.viewer_intent_interpretation ?? "");

      setSource(data.source);

      setRailKey((k) => k + 1);

      setHasLoaded(true);

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



  const loadProfile = useCallback(

    async (profileId: ViewerProfileId) => {

      setInitialLoading(true);

      try {

        const data = await fetchJson<DiscoverPayload & { intent: string }>(

          `/api/cache/${storeKey}/discover/${profileId}`,

        );

        assertResolvedClipsPayload(data);

        const preset = clonePersonalizationConfig(PERSONALIZATION_PROFILES[profileId]);

        setConfig(preset);

        setCachedConfigs((prev) => ({ ...prev, [profileId]: preset }));

        applyPayload(

          {

            ...data,

            source: "cache",

            endpoint: data.endpoint ?? "GET /api/cache/discover",

          },

          preset,

        );

      } catch (err) {

        showError(err instanceof Error ? err.message : undefined);

      } finally {

        setInitialLoading(false);

      }

    },

    [storeKey, applyPayload, showError],

  );



  useEffect(() => {

    void loadProfile(viewerProfileId);

  }, [viewerProfileId, loadProfile]);



  const runDiscovery = useCallback(

    async (fetchResults: () => Promise<DiscoverPayload>, activeConfig: PersonalizationConfig) => {

      setLoading(true);

      const started = Date.now();

      const minDelay = jockeyLoadingDelayMs();

      try {

        const data = await fetchResults();

        const elapsed = Date.now() - started;

        if (elapsed < minDelay) await wait(minDelay - elapsed);

        applyPayload(data, activeConfig);

      } catch (err) {

        showError(err instanceof Error ? err.message : undefined);

      } finally {

        setLoading(false);

      }

    },

    [applyPayload, showError],

  );



  const onRun = () => {

    const cached = cachedConfigs[viewerProfileId];

    if (cached && configsEqual(config, cached)) {

      void runDiscovery(async () => {

        const data = await fetchJson<DiscoverPayload>(

          `/api/cache/${storeKey}/discover/${viewerProfileId}`,

        );

        assertResolvedClipsPayload(data);

        return {

          ...data,

          source: "cache" as const,

          endpoint: data.endpoint ?? "GET /api/cache/discover",

        };

      }, config);

      return;

    }



    void runDiscovery(async () => {

      const intent = configToIntent(config);

      const data = await fetchJson<DiscoverPayload>("/api/jockey/discover", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ storeKey, intent, personalizationConfig: config }),

      });

      assertResolvedClipsPayload(data);

      return data;

    }, config);

  };



  return (

    <div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

        <p className="text-sm text-foreground-subtle">Example audience profiles</p>

        <ToggleButtons

          value={viewerProfileId}

          onValueChange={(v) => setViewerProfileId(v as ViewerProfileId)}

          gap

        >

          {VIEWER_PROFILES.map((p) => (

            <ToggleButton

              key={p.id}

              value={p.id}

              data-testid={`discover-profile-${p.id}`}

              disabled={loading}

            >

              {p.label}

            </ToggleButton>

          ))}

        </ToggleButtons>

      </div>



      <PersonalizationConfigTable
        config={config}
        onChange={setConfig}
        storeCharacters={storeCharacters}
      />



      <div className="mb-6 flex items-center justify-end gap-2">

        <PersonalizationDataToggle

          open={dataViewOpen}

          onToggle={() => setDataViewOpen((open) => !open)}

          disabled={!hasLoaded || clips.length === 0 || loading}

        />

        <Button variant="primary" onClick={onRun} disabled={loading} data-testid="discover-run-button">

          {loading ? (

            <HourglassIcon className="size-4 animate-pulse" />

          ) : (

            <>

              <AnalyzeIcon className="size-4" />

              Run discovery

            </>

          )}

        </Button>

      </div>



      <PersonalizationDataModal

        open={dataViewOpen && !loading}

        onClose={() => setDataViewOpen(false)}

        storeKey={storeKey}

        profileId={viewerProfileId}

        config={config}

        source={source}

        clips={clips}

        exchange={lastApiExchange as ApiExchange | null}

      />



      {isLive && !loading && viewerIntentInterpretation && (
        <Banner variant="info" className="mb-4">
          <span className="font-medium">Brief interpretation:</span> {viewerIntentInterpretation}
        </Banner>
      )}

      {isLive && !loading && (
        <Banner variant="info" className="mb-6">
          Live Jockey discovery — results from POST /responses
        </Banner>
      )}



      {!loading && hasLoaded && clips.length === 0 && (

        <Banner className="mb-6" variant="warning">

          Jockey returned results, but none could be matched to playable clips in this library.

        </Banner>

      )}



      {initialLoading ? (

        <PanelContentSkeleton variant="discover" />

      ) : loading ? (

        <JockeySearchLoading seriesName={storeDisplayName} message={loadingMessage} />

      ) : (

        clips.length > 0 && (

          <>

            <div className="mb-4">

              <h2 className="text-lg font-normal">Recommended videos</h2>

              <p className="mt-1 text-sm text-foreground-subtle">

                Ranked clips tuned to your audience configuration for {storeDisplayName}

              </p>

            </div>

            <DiscoverRail key={railKey} testId="discover-rail">

              {clips.map((clip, i) => (

                <RevealOnScroll key={clip.id} staggerIndex={i} className="shrink-0">

                  <DiscoverClipCard clip={clip} rank={clip.rank ?? i + 1} />

                </RevealOnScroll>

              ))}

            </DiscoverRail>

          </>

        )

      )}

    </div>

  );

}


