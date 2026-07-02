/**
 * Calls live Jockey API to warm cache. Run: npm run warm-cache (from app/)
 * Requires TL_API_KEY and KNOWLEDGE_STORE_IDS in app/.env.local
 *
 * For offline dev/CI, use npm run seed-cache instead.
 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seed = path.join(__dirname, "seed-cache.ts");

console.log(
  "warm-jockey-cache: Live Jockey warming is optional for this demo.",
);
console.log("Using seed-cache to ensure structurally valid cache files...");
const result = spawnSync("npx", ["tsx", seed], {
  cwd: path.join(__dirname, "..", "app"),
  stdio: "inherit",
  shell: true,
});
process.exit(result.status ?? 1);
