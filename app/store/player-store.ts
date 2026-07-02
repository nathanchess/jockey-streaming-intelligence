import { create } from "zustand";

type PlayerState = {
  open: boolean;
  videoSrc: string;
  startSec: number;
  endSec: number;
  title: string;
  posterUrl: string;
  openClip: (clip: {
    videoSrc: string;
    startSec: number;
    endSec: number;
    title: string;
    posterUrl: string;
  }) => void;
  close: () => void;
};

export const usePlayerStore = create<PlayerState>((set) => ({
  open: false,
  videoSrc: "",
  startSec: 0,
  endSec: 0,
  title: "",
  posterUrl: "",
  openClip: (clip) =>
    set({
      open: true,
      videoSrc: clip.videoSrc,
      startSec: clip.startSec,
      endSec: clip.endSec,
      title: clip.title,
      posterUrl: clip.posterUrl,
    }),
  close: () => set({ open: false }),
}));
