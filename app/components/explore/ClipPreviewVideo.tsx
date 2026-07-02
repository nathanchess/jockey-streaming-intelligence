"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SpinnerIcon, ExclamationIcon, cn } from "@twelvelabs-io/react";
import type { ResolvedClip } from "@/lib/types";
import { clampMediaTime } from "@/lib/types";
import { DEMO_VIDEO_SUPPRESS_NATIVE_UI } from "@/lib/demo-video";

type Props = {
  clip: ResolvedClip;
  className?: string;
  /** When set, fade from poster frame to playing video after delay (featured carousel). */
  autoPlayAfterMs?: number;
  /** When true, only the active carousel slide may auto-play. */
  active?: boolean;
  /** Hover-triggered preview for rail cards. */
  hoverPlay?: boolean;
  onPlayingChange?: (playing: boolean) => void;
};

export function ClipPreviewVideo({
  clip,
  className,
  autoPlayAfterMs,
  active = true,
  hoverPlay = false,
  onPlayingChange,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [frameReady, setFrameReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [hovering, setHovering] = useState(false);

  const shouldPlay = active && (hoverPlay ? hovering : Boolean(autoPlayAfterMs));

  const startSec = clampMediaTime(clip.startSec);
  const endSec = clampMediaTime(clip.endSec, startSec + 1);

  const seekToStart = useCallback(
    (onSeeked?: () => void) => {
      const video = videoRef.current;
      if (!video) return;

      const handleSeeked = () => {
        video.pause();
        onSeeked?.();
      };

      video.addEventListener("seeked", handleSeeked, { once: true });
      video.currentTime = startSec;
    },
    [startSec],
  );

  const seekToPosterFrame = useCallback(() => {
    seekToStart(() => setFrameReady(true));
  }, [seekToStart]);

  useEffect(() => {
    setFrameReady(false);
    setLoadError(false);
    setPlaying(false);
    setHovering(false);
    onPlayingChange?.(false);
  }, [clip.id, clip.videoSrc, startSec, onPlayingChange]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onReady = () => seekToPosterFrame();

    if (video.readyState >= 1) onReady();
    else video.addEventListener("loadedmetadata", onReady, { once: true });

    return () => {
      video.removeEventListener("loadedmetadata", onReady);
    };
  }, [clip.id, clip.videoSrc, seekToPosterFrame]);

  useEffect(() => {
    if (!autoPlayAfterMs || !active || hoverPlay) return;
    const id = window.setTimeout(() => setPlaying(true), autoPlayAfterMs);
    return () => window.clearTimeout(id);
  }, [autoPlayAfterMs, active, hoverPlay, clip.id]);

  useEffect(() => {
    if (hoverPlay) setPlaying(hovering && active);
  }, [hoverPlay, hovering, active]);

  const syncPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video || !frameReady) return;

    if (!shouldPlay || !playing) {
      video.pause();
      const atClipStart =
        Number.isFinite(video.currentTime) && Math.abs(video.currentTime - startSec) < 0.15;
      const shouldResetToStart =
        !Number.isFinite(video.currentTime) ||
        video.currentTime < startSec ||
        video.currentTime >= endSec ||
        (hoverPlay && !atClipStart);

      if (shouldResetToStart) {
        seekToStart();
      }
      onPlayingChange?.(false);
      return;
    }

    if (
      !Number.isFinite(video.currentTime) ||
      video.currentTime < startSec ||
      video.currentTime >= endSec
    ) {
      video.currentTime = startSec;
    }

    void video.play().catch(() => {
      setPlaying(false);
    });
    onPlayingChange?.(true);
  }, [endSec, frameReady, hoverPlay, onPlayingChange, playing, seekToStart, shouldPlay, startSec]);

  useEffect(() => {
    syncPlayback();
  }, [syncPlayback]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !playing) return;
    if (video.currentTime >= endSec) {
      video.currentTime = startSec;
      void video.play().catch(() => undefined);
    }
  };

  const handleMouseLeave = () => {
    setHovering(false);
    if (!hoverPlay) return;

    setPlaying(false);
    const video = videoRef.current;
    if (!video || !frameReady) return;

    video.pause();
    seekToStart();
  };

  return (
    <div
      className={cn("clip-preview-video relative overflow-hidden bg-surface-muted", className)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={handleMouseLeave}
    >
      {!frameReady && !loadError && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-surface-muted"
          aria-busy="true"
          aria-label="Loading preview"
        >
          <SpinnerIcon className="size-6 animate-spin text-foreground-subtle/50" />
        </div>
      )}
      {loadError && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-muted px-4 text-center"
          data-testid="clip-preview-error"
        >
          <ExclamationIcon className="size-6 text-foreground-subtle" />
          <span className="text-xs text-foreground-subtle">Preview unavailable</span>
        </div>
      )}
      <video
        ref={videoRef}
        src={clip.videoSrc}
        muted
        playsInline
        preload="metadata"
        {...DEMO_VIDEO_SUPPRESS_NATIVE_UI}
        className={cn(
          "pointer-events-none absolute inset-0 size-full object-cover",
          frameReady && !loadError ? "opacity-100" : "opacity-0",
        )}
        onTimeUpdate={handleTimeUpdate}
        onError={() => setLoadError(true)}
      />
    </div>
  );
}
