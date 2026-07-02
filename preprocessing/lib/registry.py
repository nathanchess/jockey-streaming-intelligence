"""Incremental persistence for knowledge store IDs and per-asset checkpoint state."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from lib.manifest import load_json, save_json

INDEXED_READY = "indexed_ready"


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


class Registry:
    """Authoritative store_key -> knowledge_store_id map."""

    def __init__(self, path: Path) -> None:
        self.path = path
        self.data: dict[str, Any] = {"stores": {}}
        if path.exists():
            self.data = load_json(path)

    def get_store_id(self, store_key: str) -> str | None:
        store = self.data.get("stores", {}).get(store_key)
        if store:
            return store.get("knowledge_store_id")
        return None

    def set_store(
        self,
        store_key: str,
        knowledge_store_id: str,
        name: str,
        display_name: str,
        http_status: int,
    ) -> None:
        self.data.setdefault("stores", {})[store_key] = {
            "knowledge_store_id": knowledge_store_id,
            "name": name,
            "display_name": display_name,
            "created_at": _utc_now_iso(),
            "create_response_status": http_status,
        }
        self.data["updated_at"] = _utc_now_iso()
        save_json(self.path, self.data)

    def all_store_ids(self) -> dict[str, str]:
        return {
            k: v["knowledge_store_id"]
            for k, v in self.data.get("stores", {}).items()
            if v.get("knowledge_store_id")
        }


class Checkpoint:
    """Per-asset pipeline progress for --resume."""

    def __init__(self, path: Path, run_id: str) -> None:
        self.path = path
        self.run_id = run_id
        self.data: dict[str, Any] = {"run_id": run_id, "assets": {}}
        if path.exists():
            loaded = load_json(path)
            if loaded.get("assets"):
                self.data = loaded
            self.data["run_id"] = run_id

    def is_indexed_ready(self, asset_id: str) -> bool:
        entry = self.data.get("assets", {}).get(asset_id, {})
        return entry.get("status") == INDEXED_READY

    def get_asset(self, asset_id: str) -> dict[str, Any]:
        return self.data.get("assets", {}).get(asset_id, {})

    def update_asset(self, asset_id: str, patch: dict[str, Any]) -> None:
        assets = self.data.setdefault("assets", {})
        entry = assets.setdefault(asset_id, {})
        entry.update(patch)
        self.data["updated_at"] = _utc_now_iso()
        save_json(self.path, self.data)

    def mark_indexed_ready(
        self,
        asset_id: str,
        knowledge_store_id: str,
        store_key: str,
        twelvelabs_asset_id: str,
        item_id: str,
        completed_steps: list[str],
        timestamps: dict[str, str],
    ) -> None:
        self.update_asset(
            asset_id,
            {
                "status": INDEXED_READY,
                "knowledge_store_id": knowledge_store_id,
                "store_key": store_key,
                "asset_id": twelvelabs_asset_id,
                "item_id": item_id,
                "completed_steps": completed_steps,
                "timestamps": timestamps,
            },
        )

    def completed_count(self) -> int:
        return sum(
            1 for a in self.data.get("assets", {}).values() if a.get("status") == INDEXED_READY
        )


def build_snapshot(
    stores_config: dict[str, Any],
    registry: Registry,
    manifest_assets: list[dict[str, Any]],
) -> dict[str, Any]:
    """Build denormalized jockey-snapshot.json from registry + manifest."""
    snapshot_stores: dict[str, Any] = {}
    grouped: dict[str, list[dict[str, Any]]] = {}
    for asset in manifest_assets:
        grouped.setdefault(asset["store_key"], []).append(asset)

    for store_key, cfg in stores_config.items():
        reg = registry.data.get("stores", {}).get(store_key, {})
        snapshot_stores[store_key] = {
            "knowledge_store_id": reg.get("knowledge_store_id"),
            "name": cfg.get("name"),
            "display_name": cfg.get("display_name"),
            "vertical": cfg.get("vertical"),
            "assets": grouped.get(store_key, []),
        }

    return {
        "updated_at": _utc_now_iso(),
        "stores": snapshot_stores,
        "routing_hints": {
            "semantic_search": "use selected store_key from UI",
            "personalized_discovery_unified": "optional future unified store id",
            "fast_programming": "scope to single store_key matching channel vertical",
        },
    }


def write_snapshot(path: Path, snapshot: dict[str, Any]) -> None:
    save_json(path, snapshot)


def write_env_store_ids(env_path: Path, store_ids: dict[str, str]) -> None:
    """Update or append KNOWLEDGE_STORE_IDS in .env."""
    import json

    line = f"KNOWLEDGE_STORE_IDS={json.dumps(store_ids)}\n"
    if not env_path.exists():
        env_path.write_text(line, encoding="utf-8")
        return

    lines = env_path.read_text(encoding="utf-8").splitlines(keepends=True)
    found = False
    out: list[str] = []
    for existing in lines:
        if existing.startswith("KNOWLEDGE_STORE_IDS="):
            out.append(line)
            found = True
        else:
            out.append(existing if existing.endswith("\n") else existing + "\n")
    if not found:
        out.append(line)
    env_path.write_text("".join(out), encoding="utf-8")
