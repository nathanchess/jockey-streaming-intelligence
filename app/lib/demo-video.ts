import type { VideoHTMLAttributes } from "react";

/** Props that suppress browser-native video hover UI (PiP, enhance, etc.). */
export const DEMO_VIDEO_SUPPRESS_NATIVE_UI = {
  controls: false,
  disablePictureInPicture: true,
  disableRemotePlayback: true,
  controlsList: "nodownload nofullscreen noremoteplayback noplaybackrate",
} satisfies Pick<
  VideoHTMLAttributes<HTMLVideoElement>,
  "controls" | "disablePictureInPicture" | "disableRemotePlayback" | "controlsList"
>;
