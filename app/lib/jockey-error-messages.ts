const ERROR_TITLES = [
  "Frame drop detected",
  "Jockey hit a buffering wall",
  "Semantic search took a coffee break",
  "Timeline sync lost the plot",
  "Video AI went off-script",
];

const ERROR_MESSAGES = [
  "Our models couldn't index that moment — the pixels refused to cooperate. Try again in a beat.",
  "TwelveLabs Jockey tripped over a keyframe. Even video AI has off days.",
  "The embedding space got a little too abstract. Refresh and we'll re-run the scene.",
  "Something glitched between ingest and playback. Jockey's re-watching the tape.",
  "We lost signal in the vector vault. Your library is still there — this request just didn't land.",
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export function jockeyErrorCopy(detail?: string): { title: string; message: string } {
  const title = pick(ERROR_TITLES);
  const base = pick(ERROR_MESSAGES);
  const message = detail?.trim() ? `${detail.trim()} ${base}` : base;
  return { title, message };
}

export const PAGE_ERROR_TITLE = "The timeline collapsed";
export const PAGE_ERROR_MESSAGE =
  "Jockey couldn't render this page — somewhere between metadata hydration and semantic search, reality diverged. Hit retry and we'll cue the next take.";

export const VIDEO_PLAYBACK_ERROR_TITLE = "Clip went missing in the edit bay";
export const VIDEO_PLAYBACK_ERROR_MESSAGE =
  "This preview couldn't load — the file may be offline or the ingest never finished. Try another moment from the library.";
