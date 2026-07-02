from __future__ import annotations

import argparse
import json
import logging
import os
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / "preprocessing" / ".env")

log = logging.getLogger("hydrate")
BASE_URL = "https://api.twelvelabs.io/v1.3"
ROOT = Path(__file__).parent
CAST_DIR = ROOT / "output" / "cast"
HYDRATION_DIR = ROOT / "output" / "hydration"
MANIFEST_PATH = ROOT.parent / "preprocessing" / "data" / "library-manifest.json"

CAST_SCHEMA = {
    "type": "object",
    "properties": {
        "cast_list": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "role": {"type": "string"},
                    "description": {"type": "string"},
                    "importance": {
                        "type": "string",
                        "description": "primary | secondary | supporting",
                    },
                    "cross_episode_reasoning": {
                        "type": "string",
                        "description": "Why this character matters across the full series.",
                    },
                    "key_moments": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "episode_label": {"type": "string"},
                                "description": {"type": "string"},
                                "timestamp_start": {"type": "string"},
                                "timestamp_end": {"type": "string"},
                                "reasoning": {"type": "string"},
                            },
                            "required": [
                                "episode_label",
                                "description",
                                "timestamp_start",
                                "timestamp_end",
                                "reasoning",
                            ],
                        },
                    },
                },
                "required": [
                    "name",
                    "role",
                    "description",
                    "importance",
                    "cross_episode_reasoning",
                    "key_moments",
                ],
            },
        },
    },
    "required": ["cast_list"],
}

EPISODE_SCHEMA = {
    "type": "object",
    "properties": {
        "asset_title": {"type": "string"},
        "tags": {"type": "array", "items": {"type": "string"}},
        "characters_present": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Names of every character who appears in this episode.",
        },
        "episode_summary": {
            "type": "string",
            "description": (
                "Multi-paragraph narrative: specific cause-and-effect beats, named characters, "
                "what happened and why it mattered in this episode."
            ),
        },
        "episode_importance_in_series": {
            "type": "string",
            "description": (
                "Why THIS episode matters in THIS series specifically — not generic format description. "
                "Reference prior/future season context where relevant."
            ),
        },
        "most_important_scene": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "timestamp_start": {"type": "string"},
                "timestamp_end": {"type": "string"},
                "description": {"type": "string"},
                "reasoning": {"type": "string"},
                "characters_present": {"type": "array", "items": {"type": "string"}},
            },
            "required": [
                "title",
                "timestamp_start",
                "timestamp_end",
                "description",
                "reasoning",
                "characters_present",
            ],
        },
        "episode_timeline": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "timestamp_start": {"type": "string"},
                    "timestamp_end": {"type": "string"},
                    "label": {"type": "string"},
                    "description": {"type": "string"},
                    "characters_present": {"type": "array", "items": {"type": "string"}},
                    "reasoning": {"type": "string"},
                },
                "required": [
                    "timestamp_start",
                    "timestamp_end",
                    "label",
                    "description",
                    "characters_present",
                    "reasoning",
                ],
            },
        },
    },
    "required": [
        "asset_title",
        "tags",
        "characters_present",
        "episode_summary",
        "episode_importance_in_series",
        "most_important_scene",
        "episode_timeline",
    ],
}

CAST_INSTRUCTIONS = (
    "Analyze ALL episodes indexed in this knowledge store. Build one cast_list for the entire series. "
    "For each character: role, description, importance (primary/secondary/supporting), "
    "cross_episode_reasoning (series-wide arcs and relationships), and key_moments across any episode "
    "(include episode_label per moment). Use real names when known."
)

EPISODE_INSTRUCTIONS = (
    "Hydrate ONE episode using the knowledge store plus the compact cast JSON provided. "
    "Write at high depth — no generic one-liners.\n"
    "characters_present: flat list of names who appear in this episode.\n"
    "episode_summary: 3–5 paragraphs. Trace causal chains (e.g. 'X burned her streak, which caused Y, "
    "leading Gordon Ramsay to Z'). Name characters, key actions, emotional stakes, and consequences.\n"
    "episode_importance_in_series: specific to this episode in this series — what changed, who was "
    "eliminated or broke through, how it connects to the season arc. Not a generic show-format blurb.\n"
    "most_important_scene: the single pivotal beat with timestamps, 2–4 sentence description, reasoning.\n"
    "episode_timeline: 10–16 ordered beats covering the full episode. Each beat needs timestamps, a short "
    "label, 2–4 sentence description (named characters, actions, why it mattered), characters_present, "
    "and reasoning. Be as specific as 'Amanda drops her dish, leading to…' with real timestamps from video."
)


def _headers() -> dict[str, str]:
    key = os.environ.get("TL_API_KEY")
    if not key:
        sys.exit("Set TL_API_KEY in preprocessing/.env")
    return {"x-api-key": key, "Content-Type": "application/json"}


def _ks_id(store_key: str) -> str:
    ks = json.loads(os.environ.get("KNOWLEDGE_STORE_IDS", "{}")).get(store_key)
    if not ks:
        sys.exit(f"No knowledge store id for {store_key}")
    return ks


def _assets_for_store(store_key: str) -> list[dict]:
    return [a for a in _load_manifest()["assets"] if a["store_key"] == store_key]


def _load_manifest() -> dict:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def _episode_catalog(assets: list[dict]) -> str:
    lines = []
    for a in assets:
        lines.append(
            f"- {a['id']} | {a.get('episode_label', '')} | {a['youtube_metadata']['original_title']}"
        )
    return "\n".join(lines)


def _parse_output(result: dict) -> dict:
    for block in result.get("output", []):
        for part in block.get("content", []):
            if part.get("type") in ("output_text", "text") and part.get("text"):
                return json.loads(part["text"])
    raise ValueError(f"No JSON in response: {json.dumps(result)[:500]}")


def _trunc(text: str, n: int = 200) -> str:
    text = " ".join(text.split())
    return text if len(text) <= n else text[: n - 3] + "..."


def _log_cast_summary(cast: dict) -> None:
    for c in cast.get("cast_list", []):
        moments = len(c.get("key_moments", []))
        log.info(
            "  • %s (%s) — %s | %d key moments",
            c.get("name"),
            c.get("importance"),
            c.get("role"),
            moments,
        )
        log.debug("    cross_episode: %s", _trunc(c.get("cross_episode_reasoning", ""), 300))


def _log_episode_summary(meta: dict) -> None:
    log.info("  title: %s", meta.get("asset_title"))
    log.info("  tags: %s", ", ".join(meta.get("tags", [])))
    log.info("  characters: %s", ", ".join(meta.get("characters_present", [])[:12]))
    log.info("  summary: %s", _trunc(meta.get("episode_summary", ""), 500))
    log.info("  series importance: %s", _trunc(meta.get("episode_importance_in_series", ""), 400))
    scene = meta.get("most_important_scene") or {}
    if scene:
        log.info(
            "  key scene: %s (%s–%s)",
            scene.get("title"),
            scene.get("timestamp_start"),
            scene.get("timestamp_end"),
        )
    log.info("  timeline beats: %d", len(meta.get("episode_timeline", [])))


def _jockey(
    ks_id: str,
    *,
    step: str,
    instructions: str,
    user_content: str,
    schema_name: str,
    schema: dict,
    max_output_tokens: int = 8192,
) -> dict:
    log.info("[%s] calling Jockey — schema=%s ks=%s", step, schema_name, ks_id)
    log.debug("[%s] user prompt:\n%s", step, user_content)

    body = {
        "model": "jockey1.0",
        "knowledge_store_id": ks_id,
        "instructions": instructions,
        "input": [{"type": "message", "role": "user", "content": user_content}],
        "text": {"format": {"type": "json_schema", "name": schema_name, "schema": schema}},
        "max_output_tokens": max_output_tokens,
    }
    t0 = time.monotonic()
    res = requests.post(f"{BASE_URL}/responses", headers=_headers(), json=body, timeout=600)
    elapsed = time.monotonic() - t0

    if not res.ok:
        log.error("[%s] API failed %s: %s", step, res.status_code, res.text[:800])
        sys.exit(1)

    parsed = _parse_output(res.json())
    log.info("[%s] done in %.1fs", step, elapsed)
    log.debug("[%s] raw response:\n%s", step, json.dumps(parsed, indent=2))
    return parsed


def _save(path: Path, data: dict) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")
    log.info("wrote %s (%d bytes)", path, path.stat().st_size)
    return path


def _hydrate_cast(ks_id: str, store_key: str, assets: list[dict]) -> dict:
    series = assets[0].get("series", store_key) if assets else store_key
    catalog = _episode_catalog(assets)
    log.info("PASS 1 — series cast for %s (%d episodes)", series, len(assets))
    log.info("episode catalog:\n%s", catalog)

    cast = _jockey(
        ks_id,
        step="pass1-cast",
        instructions=CAST_INSTRUCTIONS,
        user_content=(
            f"Series: {series}\n"
            f"Knowledge store covers these episodes:\n{catalog}\n\n"
            "Return one cast_list for the entire series across all episodes above."
        ),
        schema_name="cast_metadata_pass1",
        schema=CAST_SCHEMA,
    )
    cast["_meta"] = {
        "knowledge_store_id": ks_id,
        "store_key": store_key,
        "series": series,
        "episode_count": len(assets),
        "pass": 1,
    }
    log.info("PASS 1 — generated %d characters:", len(cast.get("cast_list", [])))
    _log_cast_summary(cast)
    return cast


CAST_PROMPT_MAX_BYTES = 3200


def _slim_cast_for_prompt(cast: dict, asset_id: str) -> tuple[list[dict], str]:
    """Minimal cast for pass 2 — short keys, truncated text, byte budget."""
    by_name: dict[str, dict] = {}
    for c in cast.get("cast_list", []):
        name = c["name"]
        ep_moments = [m for m in c.get("key_moments", []) if m.get("episode_label") == asset_id]
        entry = {
            "name": name,
            "role": c["role"],
            "importance": c.get("importance", "supporting"),
            "arc": _trunc(c.get("cross_episode_reasoning", ""), 100),
        }
        if ep_moments:
            entry["ep"] = _trunc(ep_moments[0]["description"], 80)
        if name not in by_name:
            by_name[name] = entry
        elif ep_moments and "ep" not in by_name[name]:
            by_name[name]["ep"] = _trunc(ep_moments[0]["description"], 80)

    primaries = [e for e in by_name.values() if e["importance"] == "primary"]
    rest = sorted(
        [e for e in by_name.values() if e["importance"] != "primary"],
        key=lambda e: (0 if "ep" in e else 1, 0 if e["importance"] == "secondary" else 1),
    )

    kept = list(primaries)
    for e in rest:
        trial = kept + [e]
        if len(json.dumps({"cast": trial}, separators=(",", ":"))) <= CAST_PROMPT_MAX_BYTES:
            kept.append(e)

    payload = json.dumps({"cast": kept}, separators=(",", ":"))
    return kept, payload


def _cast_prompt_block(cast: dict, asset_id: str) -> str:
    slim, payload = _slim_cast_for_prompt(cast, asset_id)
    full_n = len(cast.get("cast_list", []))
    log.info(
        "cast prompt: %d → %d chars (%d bytes, budget %d, full was %d)",
        full_n,
        len(slim),
        len(payload),
        CAST_PROMPT_MAX_BYTES,
        len(json.dumps({k: v for k, v in cast.items() if not k.startswith("_")})),
    )
    return payload


def _hydrate_episode(ks_id: str, asset: dict, cast: dict) -> dict:
    asset_id = asset["id"]
    episode_label = asset.get("episode_label", "")
    source_title = asset["youtube_metadata"]["original_title"]
    log.info(
        "PASS 2 — hydrating %s | %s | %s",
        asset_id,
        episode_label,
        source_title,
    )

    cast_block = _cast_prompt_block(cast, asset_id)
    user_content = (
        f"Episode: {asset_id} | {episode_label}\n"
        f"Title: {source_title}\n\n"
        f"Cast:\n{cast_block}"
    )
    log.info("user content: %d bytes", len(user_content))
    meta = _jockey(
        ks_id,
        step=f"pass2-{asset_id}",
        instructions=EPISODE_INSTRUCTIONS,
        user_content=user_content,
        schema_name="episode_metadata_pass2",
        schema=EPISODE_SCHEMA,
        max_output_tokens=16384,
    )
    meta["asset_id"] = asset_id
    meta["_meta"] = {
        "knowledge_store_id": ks_id,
        "store_key": asset["store_key"],
        "episode_label": episode_label,
        "pass": 2,
    }
    _log_episode_summary(meta)
    return meta


def hydrate_metadata(store_key: str, *, skip_pass1: bool = False, force: bool = False) -> None:
    log.info("=== hydrate_metadata start: %s ===", store_key)
    ks_id = _ks_id(store_key)
    assets = _assets_for_store(store_key)
    if not assets:
        log.error("no assets in manifest for %s", store_key)
        sys.exit(1)

    log.info("ks_id=%s | %d assets from manifest", ks_id, len(assets))

    cast_path = CAST_DIR / f"{store_key}.json"
    if skip_pass1 and cast_path.exists():
        log.info("skipping pass 1 — loading %s", cast_path)
        cast = json.loads(cast_path.read_text(encoding="utf-8"))
    else:
        cast = _hydrate_cast(ks_id, store_key, assets)
        cast_path = _save(cast_path, cast)

    for i, asset in enumerate(assets, 1):
        out = HYDRATION_DIR / store_key / f"{asset['id']}.json"
        if out.exists() and not force:
            log.info("--- episode %d/%d — skip existing %s ---", i, len(assets), out.name)
            continue
        log.info("--- episode %d/%d ---", i, len(assets))
        meta = _hydrate_episode(ks_id, asset, cast)
        meta["_meta"]["cast_file"] = str(cast_path.relative_to(ROOT))
        _save(out, meta)

    log.info("=== hydrate_metadata complete: %s ===", store_key)

def load_cast_metadata(store_key: str) -> dict | None:
    path = CAST_DIR / f"{store_key}.json"
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else None


def load_hydration_metadata(store_key: str, asset_id: str) -> dict | None:
    path = HYDRATION_DIR / store_key / f"{asset_id}.json"
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else None


def main() -> None:
    p = argparse.ArgumentParser(description="2-pass hydrate: series cast, then each episode")
    p.add_argument("store_key", help="e.g. lizzie_bennet")
    p.add_argument("-v", "--verbose", action="store_true", help="log full prompts and JSON responses")
    p.add_argument(
        "--skip-pass1",
        action="store_true",
        help="reuse output/cast/{store_key}.json and only run pass 2",
    )
    p.add_argument("--force", action="store_true", help="overwrite existing hydration JSON files")
    args = p.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        datefmt="%H:%M:%S",
    )

    hydrate_metadata(args.store_key, skip_pass1=args.skip_pass1, force=args.force)


if __name__ == "__main__":
    main()
