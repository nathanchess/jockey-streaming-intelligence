"""Append-only JSONL telemetry for upload/index pipeline steps."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


class Telemetry:
    def __init__(self, run_id: str, output_dir: Path) -> None:
        self.run_id = run_id
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.path = output_dir / f"{run_id}.jsonl"

    def _line(self, event: str, **fields: Any) -> None:
        record = {
            "timestamp": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "run_id": self.run_id,
            "event": event,
            **fields,
        }
        with self.path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

    def run_start(self, manifest_path: str, asset_count: int, store_keys: list[str]) -> None:
        self._line("run_start", manifest_path=manifest_path, asset_count=asset_count, store_keys=store_keys)

    def store_create_start(self, store_key: str, name: str) -> None:
        self._line("store_create_start", store_key=store_key, name=name)

    def store_create_ok(
        self, store_key: str, knowledge_store_id: str, duration_ms: int, http_status: int
    ) -> None:
        self._line(
            "store_create_ok",
            store_key=store_key,
            knowledge_store_id=knowledge_store_id,
            duration_ms=duration_ms,
            http_status=http_status,
        )

    def store_reuse(self, store_key: str, knowledge_store_id: str) -> None:
        self._line("store_reuse", store_key=store_key, knowledge_store_id=knowledge_store_id)

    def asset_upload_start(self, asset_id: str, file_size_mb: float) -> None:
        self._line("asset_upload_start", asset_id=asset_id, file_size_mb=file_size_mb)

    def asset_upload_ok(self, asset_id: str, twelvelabs_asset_id: str, duration_ms: int) -> None:
        self._line(
            "asset_upload_ok",
            asset_id=asset_id,
            twelvelabs_asset_id=twelvelabs_asset_id,
            duration_ms=duration_ms,
        )

    def asset_poll(self, asset_id: str, twelvelabs_asset_id: str, status: str, elapsed_s: float) -> None:
        self._line(
            "asset_poll",
            asset_id=asset_id,
            twelvelabs_asset_id=twelvelabs_asset_id,
            status=status,
            elapsed_s=round(elapsed_s, 1),
        )

    def asset_ready(self, asset_id: str, twelvelabs_asset_id: str, total_wait_s: float) -> None:
        self._line(
            "asset_ready",
            asset_id=asset_id,
            twelvelabs_asset_id=twelvelabs_asset_id,
            total_wait_s=round(total_wait_s, 1),
        )

    def item_create_start(self, asset_id: str, knowledge_store_id: str, twelvelabs_asset_id: str) -> None:
        self._line(
            "item_create_start",
            asset_id=asset_id,
            knowledge_store_id=knowledge_store_id,
            twelvelabs_asset_id=twelvelabs_asset_id,
        )

    def item_create_ok(self, asset_id: str, item_id: str, duration_ms: int) -> None:
        self._line("item_create_ok", asset_id=asset_id, item_id=item_id, duration_ms=duration_ms)

    def item_poll(self, asset_id: str, item_id: str, status: str, elapsed_s: float) -> None:
        self._line(
            "item_poll",
            asset_id=asset_id,
            item_id=item_id,
            status=status,
            elapsed_s=round(elapsed_s, 1),
        )

    def item_ready(self, asset_id: str, item_id: str, total_index_s: float) -> None:
        self._line(
            "item_ready",
            asset_id=asset_id,
            item_id=item_id,
            total_index_s=round(total_index_s, 1),
        )

    def step_failure(self, **context: Any) -> None:
        self._line("step_failure", **context)

    def run_complete(self, assets_indexed: int, wall_time_s: float, stores_used: list[str]) -> None:
        self._line(
            "run_complete",
            assets_indexed=assets_indexed,
            wall_time_s=round(wall_time_s, 1),
            stores_used=stores_used,
        )
