"""Load, validate, and save library sources / manifest JSON."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


VALID_VERTICALS = frozenset({"fast", "micro_drama", "archive"})


class ManifestError(Exception):
    """Invalid manifest structure or missing required fields."""


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def upload_date_to_iso(upload_date: str | None) -> str | None:
    """Convert yt-dlp upload_date (YYYYMMDD) to ISO date."""
    if not upload_date or len(upload_date) != 8:
        return None
    return f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:8]}"


def load_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def validate_sources(data: dict[str, Any]) -> None:
    stores = data.get("stores")
    assets = data.get("assets")
    if not isinstance(stores, dict) or not stores:
        raise ManifestError("'stores' must be a non-empty object")
    if not isinstance(assets, list) or not assets:
        raise ManifestError("'assets' must be a non-empty array")

    for store_key, store in stores.items():
        if not store.get("name"):
            raise ManifestError(f"Store '{store_key}' missing 'name'")
        if store.get("vertical") not in VALID_VERTICALS:
            raise ManifestError(f"Store '{store_key}' has invalid vertical")
        if not store.get("ingestion_config"):
            raise ManifestError(f"Store '{store_key}' missing 'ingestion_config'")

    seen_ids: set[str] = set()
    for asset in assets:
        asset_id = asset.get("id")
        if not asset_id:
            raise ManifestError("Each asset must have 'id'")
        if asset_id in seen_ids:
            raise ManifestError(f"Duplicate asset id: {asset_id}")
        seen_ids.add(asset_id)

        store_key = asset.get("store_key")
        if store_key not in stores:
            raise ManifestError(f"Asset '{asset_id}' references unknown store_key '{store_key}'")
        if not asset.get("url"):
            raise ManifestError(f"Asset '{asset_id}' missing 'url'")
        if not asset.get("messy_metadata"):
            raise ManifestError(f"Asset '{asset_id}' missing 'messy_metadata'")


def enrich_asset_from_store(asset: dict[str, Any], stores: dict[str, Any]) -> dict[str, Any]:
    """Return asset copy with vertical inherited from store unless overridden."""
    out = dict(asset)
    store = stores[out["store_key"]]
    if "vertical" not in out:
        out["vertical"] = store.get("vertical")
    return out


def load_sources(path: Path) -> dict[str, Any]:
    data = load_json(path)
    validate_sources(data)
    return data


def load_manifest(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise ManifestError(f"Manifest not found: {path}. Run collect_videos.py first.")
    data = load_json(path)
    if "assets" not in data:
        raise ManifestError("library-manifest.json must contain 'assets' array")
    return data


def build_youtube_metadata(info: dict[str, Any], asset: dict[str, Any]) -> dict[str, Any]:
    upload_date = info.get("upload_date")
    thumb = info.get("thumbnail")
    if not thumb and info.get("thumbnails"):
        thumb = info["thumbnails"][-1].get("url")

    meta: dict[str, Any] = {
        "youtube_id": info.get("id"),
        "original_title": info.get("title"),
        "upload_date": upload_date,
        "published_at": upload_date_to_iso(upload_date),
        "duration_sec": info.get("duration"),
        "channel": info.get("channel") or info.get("uploader"),
        "thumbnail_url": thumb,
        "webpage_url": info.get("webpage_url") or asset.get("url"),
    }
    if asset.get("playlist_id"):
        meta["playlist_id"] = asset["playlist_id"]
    if asset.get("playlist_index") is not None:
        meta["playlist_index"] = asset["playlist_index"]
    return meta


def build_manifest_entry(
    asset: dict[str, Any],
    youtube_metadata: dict[str, Any],
    processing: dict[str, Any],
    existing_jockey: dict[str, Any] | None = None,
) -> dict[str, Any]:
    entry: dict[str, Any] = {
        "id": asset["id"],
        "store_key": asset["store_key"],
        "series": asset.get("series"),
        "episode_label": asset.get("episode_label"),
        "vertical": asset.get("vertical"),
        "url": asset["url"],
        "messy_metadata": asset.get("messy_metadata", {}),
        "hydrated_metadata": None,
        "youtube_metadata": youtube_metadata,
        "processing": processing,
    }
    if existing_jockey:
        entry["jockey"] = existing_jockey
    return entry


def merge_manifest_assets(
    path: Path,
    entries: list[dict[str, Any]],
    stores: dict[str, Any],
) -> None:
    """Write or update library-manifest.json with collected entries."""
    existing: dict[str, dict[str, Any]] = {}
    if path.exists():
        prior = load_json(path)
        for a in prior.get("assets", []):
            existing[a["id"]] = a

    merged: list[dict[str, Any]] = []
    entry_by_id = {e["id"]: e for e in entries}
    for asset in entries:
        prior = existing.get(asset["id"], {})
        if prior.get("jockey") and "jockey" not in asset:
            asset["jockey"] = prior["jockey"]
        merged.append(asset)

    for aid, prior in existing.items():
        if aid not in entry_by_id:
            merged.append(prior)

    save_json(
        path,
        {
            "updated_at": _utc_now_iso(),
            "stores": stores,
            "assets": merged,
        },
    )


def update_manifest_jockey_block(path: Path, asset_id: str, jockey: dict[str, Any]) -> None:
    data = load_manifest(path)
    for asset in data.get("assets", []):
        if asset.get("id") == asset_id:
            asset["jockey"] = jockey
            break
    else:
        raise ManifestError(f"Asset '{asset_id}' not found in manifest")
    data["updated_at"] = _utc_now_iso()
    save_json(path, data)


def group_assets_by_store(assets: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for asset in assets:
        key = asset["store_key"]
        grouped.setdefault(key, []).append(asset)
    return grouped
