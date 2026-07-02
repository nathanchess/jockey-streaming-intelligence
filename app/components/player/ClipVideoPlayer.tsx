"use client";

import { TlVideoPlayer } from "./TlVideoPlayer";
import { TlYouTubePlayer } from "./TlYouTubePlayer";
import { isYouTubePlaybackSrc, youtubeIdFromPlaybackSrc } from "@/lib/playback";

type Props = {
  videoSrc: string;
  startSec: number;
  endSec: number;
  posterUrl?: string;
  className?: string;
};

export function ClipVideoPlayer({ videoSrc, startSec, endSec, posterUrl, className }: Props) {
  if (isYouTubePlaybackSrc(videoSrc)) {
    return (
      <TlYouTubePlayer
        youtubeId={youtubeIdFromPlaybackSrc(videoSrc)}
        startSec={startSec}
        endSec={endSec}
        className={className}
      />
    );
  }

  return (
    <TlVideoPlayer
      videoSrc={videoSrc}
      startSec={startSec}
      endSec={endSec}
      posterUrl={posterUrl}
      className={className}
    />
  );
}
