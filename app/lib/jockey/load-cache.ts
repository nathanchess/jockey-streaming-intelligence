import { readFileSync, existsSync } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export type CacheManifest = {
  version: number;
  generated_at: string;
  stores: Record<
    string,
    {
      hydration?: { file: string };
      search?: {
        presets: Array<{
          id: string;
          label: string;
          query: string;
          file: string;
          session_id?: string;
          featured?: boolean;
          follow_ups?: Array<{
            id: string;
            label: string;
            query: string;
            file: string;
            session_id?: string;
          }>;
        }>;
        rails: Array<{
          id: string;
          title: string;
          subtitle: string;
          clip_ids: string[];
        }>;
      };
      discover?: Record<
        string,
        { intent: string; file: string; label: string }
      >;
      program?: {
        default: { brief: string; file: string };
      };
    }
  >;
};

export function loadCacheManifest(): CacheManifest {
  const filePath = path.join(DATA_DIR, "jockey-response-manifest.json");
  if (!existsSync(filePath)) {
    throw new Error(`Missing ${filePath}. Run npm run seed-cache`);
  }
  return JSON.parse(readFileSync(filePath, "utf-8")) as CacheManifest;
}

export function loadCacheFile<T>(relativeFile: string): T {
  const filePath = path.join(DATA_DIR, relativeFile);
  if (!existsSync(filePath)) {
    throw new Error(`Missing cache file: ${filePath}`);
  }
  return JSON.parse(readFileSync(filePath, "utf-8")) as T;
}
