import type { DemoAsset } from "./types";

export type StoreCharacterOption = {
  name: string;
  role?: string;
  importance?: string;
  description?: string;
};

function importanceRank(importance?: string): number {
  if (importance === "primary") return 0;
  if (importance === "secondary") return 1;
  return 2;
}

/** Characters aggregated from the same library sources as MetadataModal / View metadata. */
export function collectStoreCharacters(assets: DemoAsset[]): StoreCharacterOption[] {
  const byKey = new Map<string, StoreCharacterOption>();

  const add = (name: string, meta?: Pick<StoreCharacterOption, "role" | "importance" | "description">) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { name: trimmed, ...meta });
      return;
    }
    if (!existing.role && meta?.role) existing.role = meta.role;
    if (!existing.description && meta?.description) existing.description = meta.description;
    if (!existing.importance && meta?.importance) existing.importance = meta.importance;
    if (
      meta?.importance &&
      importanceRank(meta.importance) < importanceRank(existing.importance)
    ) {
      existing.importance = meta.importance;
    }
  };

  for (const asset of assets) {
    for (const member of asset.series_cast ?? []) {
      add(member.name, {
        role: member.role,
        importance: member.importance,
        description: member.description,
      });
    }

    for (const name of asset.jockey_v2?.characters_present ?? []) {
      add(name);
    }

    for (const beat of asset.jockey_v2?.episode_timeline ?? []) {
      for (const name of beat.characters_present ?? []) {
        add(name);
      }
    }

    for (const cast of asset.hydrated_metadata?.cast_analysis ?? []) {
      add(cast.name, { role: cast.role, description: cast.description });
    }

    for (const name of asset.hydrated_metadata?.characters ?? []) {
      add(name);
    }

    for (const beat of asset.hydrated_metadata?.episode_timeline ?? []) {
      for (const name of beat.characters_present ?? []) {
        add(name);
      }
    }
  }

  return [...byKey.values()].sort((a, b) => {
    const byImportance = importanceRank(a.importance) - importanceRank(b.importance);
    if (byImportance !== 0) return byImportance;
    return a.name.localeCompare(b.name);
  });
}
