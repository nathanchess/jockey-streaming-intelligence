import type { DemoAsset } from "./types";
import { formatDisplayTags } from "./display-tags";
import { formatDisplayTimestamp } from "./types";

export type MetadataTableRow = {
  asset_id: string;
  field: string;
  value: string;
};

export type EpisodeMetadataRow = {
  asset_id: string;
  episode_label: string;
  title: string;
  tags: string;
  characters: string;
  timeline_label: string;
  key_scene: string;
  summary_preview: string;
};

function truncate(text: string, max = 120): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

function formatCharacterList(names: string[], maxShown = 4): string {
  if (names.length === 0) return "—";
  if (names.length <= maxShown) return names.join(", ");
  const shown = names.slice(0, maxShown).join(", ");
  return `${shown}, +${names.length - maxShown} more`;
}

export function buildEpisodeMetadataRows(assets: DemoAsset[]): EpisodeMetadataRow[] {
  return assets
    .filter((asset) => asset.jockey_v2)
    .map((asset) => {
      const v2 = asset.jockey_v2!;
      const tags = formatDisplayTags(v2.tags);
      const scene = v2.most_important_scene;
      const timelineCount = v2.episode_timeline.length;

      return {
        asset_id: asset.id,
        episode_label: asset.episode_label,
        title: v2.asset_title,
        tags: tags.length > 0 ? tags.join(" · ") : "—",
        characters: formatCharacterList(v2.characters_present),
        timeline_label:
          timelineCount > 0
            ? `${timelineCount} beats (${formatDisplayTimestamp(v2.episode_timeline[0]?.timestamp_start ?? "0:00")}–${formatDisplayTimestamp(v2.episode_timeline[timelineCount - 1]?.timestamp_end ?? "0:00")})`
            : "—",
        key_scene: scene
          ? `${scene.title} (${formatDisplayTimestamp(scene.timestamp_start)}–${formatDisplayTimestamp(scene.timestamp_end)})`
          : "—",
        summary_preview: truncate(v2.episode_summary.replace(/\n+/g, " ")),
      };
    });
}

function flattenValue(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function pushRow(rows: MetadataTableRow[], assetId: string, field: string, value: unknown) {
  const text = flattenValue(value);
  if (!text) return;
  rows.push({ asset_id: assetId, field, value: text });
}

export function flattenAssetsToTableRows(assets: DemoAsset[]): MetadataTableRow[] {
  const rows: MetadataTableRow[] = [];

  for (const asset of assets) {
    const v2 = asset.jockey_v2;
    if (!v2) continue;

    pushRow(rows, asset.id, "asset_title", v2.asset_title);
    pushRow(rows, asset.id, "characters_present", v2.characters_present);
    pushRow(rows, asset.id, "episode_summary", v2.episode_summary);
    pushRow(rows, asset.id, "episode_importance_in_series", v2.episode_importance_in_series);

    v2.tags.forEach((tag, i) => pushRow(rows, asset.id, `tag_${i + 1}`, tag));

    if (v2.most_important_scene) {
      const scene = v2.most_important_scene;
      pushRow(rows, asset.id, "most_important_scene.title", scene.title);
      pushRow(rows, asset.id, "most_important_scene.start", scene.timestamp_start);
      pushRow(rows, asset.id, "most_important_scene.end", scene.timestamp_end);
      pushRow(rows, asset.id, "most_important_scene.description", scene.description);
      pushRow(rows, asset.id, "most_important_scene.reasoning", scene.reasoning);
      pushRow(rows, asset.id, "most_important_scene.characters", scene.characters_present);
    }

    v2.episode_timeline.forEach((beat, i) => {
      const prefix = `timeline_${i + 1}`;
      pushRow(rows, asset.id, `${prefix}.label`, beat.label);
      pushRow(rows, asset.id, `${prefix}.start`, beat.timestamp_start);
      pushRow(rows, asset.id, `${prefix}.end`, beat.timestamp_end);
      pushRow(rows, asset.id, `${prefix}.description`, beat.description);
      pushRow(rows, asset.id, `${prefix}.reasoning`, beat.reasoning);
      pushRow(rows, asset.id, `${prefix}.characters`, beat.characters_present);
    });
  }

  return rows;
}

export function buildMetadataExportPayload(assets: DemoAsset[]) {
  return {
    exported_at: new Date().toISOString(),
    assets: assets
      .filter((a) => a.jockey_v2)
      .map((a) => ({
        asset_id: a.id,
        episode_label: a.episode_label,
        store_key: a.store_key,
        jockey_v2: a.jockey_v2,
      })),
  };
}

export function downloadMetadataJson(assets: DemoAsset[], filename = "jockey-metadata.json") {
  const payload = buildMetadataExportPayload(assets);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
