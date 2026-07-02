import { readdirSync, copyFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_RESULTS = path.join(__dirname, "..", "app", "test-results");
const OUT = path.join(__dirname, "..", "app", "output", "test-videos");

function walk(dir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith(".webm")) files.push(full);
  }
  return files;
}

mkdirSync(OUT, { recursive: true });
const videos = walk(TEST_RESULTS);
for (const [i, src] of videos.entries()) {
  const name = path.basename(src);
  const dest = path.join(OUT, i === 0 ? "demo-flow.webm" : name);
  copyFileSync(src, dest);
  console.log(`Copied ${src} -> ${dest}`);
}
console.log(`Copied ${videos.length} video(s) to ${OUT}`);
