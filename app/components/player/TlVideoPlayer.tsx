"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CollapseIcon,
  FullScreenIcon,
  IconButton,
  PauseIcon,
  PlayBoxedFilledIcon,
  PlayBoxedIcon,
  Slider,
  VolumeHighIcon,
  VolumeLowIcon,
  VolumeMidIcon,
  VolumeMuteIcon,
  TwelveLabsLogoMark,
  cn,
} from "@twelvelabs-io/react";
import { formatTimestamp, clampMediaTime } from "@/lib/types";
import { DEMO_VIDEO_SUPPRESS_NATIVE_UI } from "@/lib/demo-video";
import {
  VIDEO_PLAYBACK_ERROR_MESSAGE,
  VIDEO_PLAYBACK_ERROR_TITLE,
} from "@/lib/jockey-error-messages";

type Props = {
  videoSrc: string;
  startSec: number;
  endSec: number;
  posterUrl?: string;
  className?: string;
};

function volumeIcon(volume: number, muted: boolean) {
  if (muted || volume === 0) return VolumeMuteIcon;
  if (volume < 0.34) return VolumeLowIcon;
  if (volume < 0.67) return VolumeMidIcon;
  return VolumeHighIcon;
}

export function TlVideoPlayer({
  videoSrc,
  startSec,
  endSec,
  posterUrl,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentSec, setCurrentSec] = useState(startSec);
  const [ready, setReady] = useState(false);
  const [effectiveEnd, setEffectiveEnd] = useState(endSec);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const endBoundRef = useRef(endSec);
  const volumePopoverRef = useRef<HTMLDivElement>(null);

  const safeStart = clampMediaTime(startSec);
  const safeEnd = clampMediaTime(endSec, safeStart + 1);

  const clampTime = useCallback(
    (t: number) => {
      const bound = endBoundRef.current;
      return Math.min(Math.max(t, safeStart), bound > safeStart ? bound : t);
    },
    [safeStart],
  );

  const atClipEnd =
    ready && currentSec >= endBoundRef.current - 0.5 && endBoundRef.current > safeStart;
  const canResume = currentSec > safeStart + 0.5 && !atClipEnd;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = muted;
  }, [volume, muted, ready]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!volumeOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!volumePopoverRef.current?.contains(event.target as Node)) {
        setVolumeOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [volumeOpen]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setReady(false);
    setVideoError(false);
    setPlaying(false);
    setCurrentSec(safeStart);
    endBoundRef.current = safeEnd;
    setEffectiveEnd(safeEnd);

    const onLoaded = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : safeEnd;
      const resolvedEnd = safeEnd > 0 ? Math.min(safeEnd, duration) : duration;
      endBoundRef.current = resolvedEnd;
      setEffectiveEnd(resolvedEnd);
      const seekTo = clampMediaTime(safeStart, 0);
      if (seekTo <= resolvedEnd) {
        video.currentTime = seekTo;
        setCurrentSec(seekTo);
      }
      setReady(true);
      video.play().catch(() => setPlaying(false));
      setPlaying(!video.paused);
    };

    const onTimeUpdate = () => {
      const t = video.currentTime;
      setCurrentSec(t);
      const stopAt = endBoundRef.current;
      if (stopAt > safeStart && t >= stopAt - 0.25) {
        video.pause();
        setPlaying(false);
        video.currentTime = stopAt;
        setCurrentSec(stopAt);
      }
    };

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [videoSrc, safeStart, safeEnd]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || !ready) return;
    if (playing) {
      video.pause();
    } else {
      if (video.currentTime >= endBoundRef.current - 0.5) {
        video.currentTime = startSec;
      }
      video.play().catch(() => {});
    }
  };

  const onSeek = (values: number[]) => {
    const video = videoRef.current;
    if (!video || values.length === 0) return;
    const next = clampTime(values[0]);
    video.currentTime = next;
    setCurrentSec(next);
  };

  const onVolumeChange = (values: number[]) => {
    const next = values[0] / 100;
    setVolume(next);
    if (next > 0) setMuted(false);
  };

  const toggleVolumePopover = () => {
    setVolumeOpen((open) => !open);
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch {
      // Fullscreen may be blocked by browser policy.
    }
  };

  const playControlLabel = playing ? "Pause" : canResume ? "Resume" : atClipEnd ? "Replay" : "Play";
  const VolumeIcon = volumeIcon(volume, muted);

  return (
    <div
      ref={containerRef}
      className={cn(
        "tl-video-player flex flex-col overflow-hidden bg-black",
        isFullscreen && "h-full justify-center",
        className,
      )}
    >
      <div className="relative aspect-video bg-black">
        {videoError ? (
          <div
            className="flex size-full flex-col items-center justify-center gap-3 bg-surface-muted px-6 text-center"
            data-testid="video-player-error"
          >
            <TwelveLabsLogoMark className="jockey-loading-logo-wrap size-12 shrink-0" />
            <p className="text-sm font-medium">{VIDEO_PLAYBACK_ERROR_TITLE}</p>
            <p className="max-w-sm text-xs leading-relaxed text-foreground-secondary">
              {VIDEO_PLAYBACK_ERROR_MESSAGE}
            </p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={videoSrc}
              poster={posterUrl}
              playsInline
              preload="metadata"
              {...DEMO_VIDEO_SUPPRESS_NATIVE_UI}
              className="pointer-events-none size-full object-contain"
              onError={() => setVideoError(true)}
            />
            <button
              type="button"
              className="absolute inset-0 z-10 cursor-pointer bg-transparent"
              aria-label={playing ? "Pause clip" : playControlLabel}
              data-testid="video-surface-toggle"
              onClick={togglePlay}
            >
              {!playing && (
                <div
                  className="pointer-events-none flex size-full items-center justify-center bg-black/40 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
                  data-testid="video-paused-overlay"
                >
                  <div className="flex size-16 items-center justify-center rounded-full bg-black/55 ring-2 ring-white/25 backdrop-blur-sm">
                    <PlayBoxedFilledIcon className="size-8 text-white" />
                  </div>
                  <span className="sr-only">{playControlLabel}</span>
                </div>
              )}
            </button>
          </>
        )}
      </div>

      <div className="shrink-0 border-t border-border-secondary bg-surface-white px-4 py-3 pb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <IconButton
            variant="outlined-gray"
            size="regular"
            aria-label={playControlLabel}
            data-testid="video-play-pause-button"
            onClick={togglePlay}
            className="shrink-0"
            disabled={!ready}
          >
            {playing ? (
              <PauseIcon className="size-4" data-testid="video-pause-icon" />
            ) : (
              <PlayBoxedIcon className="size-4" data-testid="video-play-icon" />
            )}
          </IconButton>

          <span className="shrink-0 font-tl-mono text-xs text-foreground-subtle">
            {formatTimestamp(Math.floor(currentSec))}
          </span>

          <Slider
            className="min-w-0 flex-1"
            min={startSec}
            max={effectiveEnd}
            step={1}
            value={[clampTime(currentSec)]}
            onValueChange={onSeek}
            aria-label="Clip position"
            translucentOnPress
          />

          <span className="hidden shrink-0 font-tl-mono text-xs text-foreground-subtle sm:inline">
            {formatTimestamp(Math.floor(effectiveEnd))}
          </span>

          <div ref={volumePopoverRef} className="relative shrink-0">
            <IconButton
              variant="outlined-gray"
              size="regular"
              aria-label={volumeOpen ? "Close volume" : muted ? "Unmute" : "Volume"}
              aria-expanded={volumeOpen}
              data-testid="video-mute-button"
              onClick={toggleVolumePopover}
              className="shrink-0"
              disabled={!ready}
            >
              <VolumeIcon className="size-4" />
            </IconButton>
            {volumeOpen && (
              <div
                role="group"
                aria-label="Volume"
                className="absolute bottom-full left-1/2 z-20 mb-2 flex -translate-x-1/2 flex-col items-center rounded-xl border border-border-secondary bg-surface-white p-3 shadow-lg motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-200"
                data-testid="video-volume-popover"
              >
                <Slider
                  className="h-24"
                  orientation="vertical"
                  min={0}
                  max={100}
                  step={1}
                  value={[muted ? 0 : Math.round(volume * 100)]}
                  onValueChange={onVolumeChange}
                  aria-label="Volume level"
                  data-testid="video-volume-slider"
                  translucentOnPress
                />
              </div>
            )}
          </div>

          <IconButton
            variant="outlined-gray"
            size="regular"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            data-testid="video-fullscreen-button"
            onClick={toggleFullscreen}
            className="shrink-0"
            disabled={!ready}
          >
            {isFullscreen ? (
              <CollapseIcon className="size-4" />
            ) : (
              <FullScreenIcon className="size-4" />
            )}
          </IconButton>
        </div>
      </div>
    </div>
  );
}
