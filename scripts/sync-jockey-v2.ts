import { cpSync, existsSync, mkdirSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "experiments", "output");
const DST = path.join(ROOT, "app", "data", "jockey-v2");

function main() {
  if (!existsSync(SRC)) {
    console.error("Missing experiments/output — run experiments/main.py first");
    process.exit(1);
  }
  mkdirSync(path.join(DST, "cast"), { recursive: true });
  mkdirSync(path.join(DST, "hydration"), { recursive: true });

  const castDir = path.join(SRC, "cast");
  if (existsSync(castDir)) {
    for (const file of readdirSync(castDir).filter((f) => f.endsWith(".json"))) {
      cpSync(path.join(castDir, file), path.join(DST, "cast", file));
    }
  }

  const hydrationDir = path.join(SRC, "hydration");
  if (existsSync(hydrationDir)) {
    for (const store of readdirSync(hydrationDir)) {
      const srcStore = path.join(hydrationDir, store);
      const dstStore = path.join(DST, "hydration", store);
      mkdirSync(dstStore, { recursive: true });
      for (const file of readdirSync(srcStore).filter((f) => f.endsWith(".json"))) {
        cpSync(path.join(srcStore, file), path.join(dstStore, file));
      }
    }
  }

  console.log("Synced jockey-v2 data to app/data/jockey-v2");
}

main();
