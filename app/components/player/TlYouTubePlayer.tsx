"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  IconButton,
  PauseIcon,
  PlayBoxedFilledIcon,
  TwelveLabsLogoMark,
  cn,
} from "@twelvelabs-io/react";
import { formatTimestamp, clampMediaTime } from "@/lib/types";
import {
  VIDEO_PLAYBACK_ERROR_MESSAGE,
  VIDEO_PLAYBACK_ERROR_TITLE,
} from "@/lib/jockey-error-messages";

type Props = {
  youtubeId: string;
  startSec: number;
  endSec: number;
  className?: string;
};

type YtPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (event: { target: YtPlayer }) => void;
            onStateChange?: (event: { data: number; target: YtPlayer }) => void;
            onError?: () => void;
          };
        },
      ) => YtPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<void> | null = null;

function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();

  ytApiPromise ??= new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };

    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return ytApiPromise;
}

export function TlYouTubePlayer({ youtubeId, startSec, endSec, className }: Props) {
  const hostId = useId().replace(/:/g, "");
  const playerRef = useRef<YtPlayer | null>(null);
  const tickRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentSec, setCurrentSec] = useState(startSec);
  const [videoError, setVideoError] = useState(false);

  const safeStart = clampMediaTime(startSec);
  const safeEnd = clampMediaTime(endSec, safeStart + 1);
  const effectiveEnd = Math.max(safeEnd, safeStart + 1);

  const stopTick = useCallback(() => {
    if (tickRef.current != null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const startTick = useCallback(
    (player: YtPlayer) => {
      stopTick();
      tickRef.current = window.setInterval(() => {
        const t = player.getCurrentTime();
        setCurrentSec(t);
        if (t >= effectiveEnd - 0.25) {
          player.pauseVideo();
          player.seekTo(safeStart, true);
          setPlaying(false);
          setCurrentSec(safeStart);
        }
      }, 200);
    },
    [effectiveEnd, safeStart, stopTick],
  );

  useEffect(() => {
    let cancelled = false;

    void loadYouTubeIframeApi().then(() => {
      if (cancelled || !window.YT?.Player) return;

      playerRef.current?.destroy();
      playerRef.current = new window.YT.Player(hostId, {
        videoId: youtubeId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          fs: 0,
          disablekb: 1,
          playsinline: 1,
          start: Math.floor(safeStart),
          origin: typeof window !== "undefined" ? window.location.origin : "",
        },
        events: {
          onReady: (event) => {
            if (cancelled) return;
            event.target.seekTo(safeStart, true);
            event.target.pauseVideo();
            setReady(true);
            setCurrentSec(safeStart);
          },
          onStateChange: (event) => {
            const playingNow = event.data === window.YT!.PlayerState.PLAYING;
            setPlaying(playingNow);
            if (playingNow) startTick(event.target);
            else stopTick();
          },
          onError: () => setVideoError(true),
        },
      });
    });

    return () => {
      cancelled = true;
      stopTick();
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [hostId, youtubeId, safeStart, startTick, stopTick]);

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player || !ready) return;
    if (playing) {
      player.pauseVideo();
      return;
    }
    player.seekTo(safeStart, true);
    player.playVideo();
  };

  const seekToRatio = (ratio: number) => {
    const player = playerRef.current;
    if (!player || !ready) return;
    const span = effectiveEnd - safeStart;
    const target = safeStart + span * ratio;
    player.seekTo(target, true);
    setCurrentSec(target);
  };

  const span = Math.max(effectiveEnd - safeStart, 1);
  const progress = Math.min(Math.max((currentSec - safeStart) / span, 0), 1);

  return (
    <div className={cn("relative aspect-video w-full bg-surface-muted", className)}>
      <div id={hostId} className="absolute inset-0 size-full [&>iframe]:size-full" />

      {videoError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-muted px-6 text-center">
          <TwelveLabsLogoMark className="jockey-loading-logo-wrap size-12 shrink-0 opacity-40" />
          <p className="text-sm font-medium text-foreground-body">{VIDEO_PLAYBACK_ERROR_TITLE}</p>
          <p className="text-xs text-foreground-subtle">{VIDEO_PLAYBACK_ERROR_MESSAGE}</p>
        </div>
      )}

      {!videoError && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-3 pt-10">
          <div className="pointer-events-auto flex items-center gap-2">
            <IconButton
              variant="primary-inverted"
              size="regular"
              aria-label={playing ? "Pause" : "Play"}
              onClick={togglePlay}
            >
              {playing ? <PauseIcon className="size-4" /> : <PlayBoxedFilledIcon className="size-4" />}
            </IconButton>
            <span className="min-w-0 flex-1 truncate text-xs text-white/90">
              {formatTimestamp(currentSec)} / {formatTimestamp(effectiveEnd)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(progress * 1000)}
            onChange={(e) => seekToRatio(Number(e.target.value) / 1000)}
            className="pointer-events-auto mt-2 h-1 w-full cursor-pointer accent-white"
            aria-label="Seek clip"
          />
        </div>
      )}
    </div>
  );
}
