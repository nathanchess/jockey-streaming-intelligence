const TAG_FILTER_PATTERNS = [/hell'?s?\s*kitchen/i, /\bseason\b/i, /\bepisode\b/i];

function titleCaseWords(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function shouldFilterDisplayTag(tag: string): boolean {
  const trimmed = tag.trim();
  if (!trimmed) return true;
  return TAG_FILTER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function formatDisplayTag(tag: string): string {
  return titleCaseWords(tag.trim());
}

export function formatDisplayTags(tags: string[] | undefined | null): string[] {
  if (!tags?.length) return [];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const tag of tags) {
    if (shouldFilterDisplayTag(tag)) continue;
    const formatted = formatDisplayTag(tag);
    const key = formatted.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(formatted);
  }

  return result;
}
