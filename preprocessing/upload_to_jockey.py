#!/usr/bin/env python3
"""Upload optimized videos to Jockey with fail-fast, telemetry, and incremental ID persistence."""

from __future__ import annotations

import argparse
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

from lib.jockey_client import JockeyApiError, JockeyClient
from lib.manifest import (
    group_assets_by_store,
    load_manifest,
    load_sources,
    update_manifest_jockey_block,
)
from lib.registry import (
    Checkpoint,
    Registry,
    build_snapshot,
    write_env_store_ids,
    write_snapshot,
)
from lib.telemetry import Telemetry

ROOT = Path(__file__).resolve().parent
DEFAULT_MANIFEST = ROOT / "data" / "library-manifest.json"
DEFAULT_SOURCES = ROOT / "data" / "library-sources.json"
REGISTRY_PATH = ROOT / "output" / "jockey-registry.json"
CHECKPOINT_PATH = ROOT / "output" / "checkpoint.json"
SNAPSHOT_PATH = ROOT / "output" / "jockey-snapshot.json"
TELEMETRY_DIR = ROOT / "output" / "telemetry"
ENV_PATH = ROOT / ".env"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Upload manifest videos to Jockey knowledge stores.")
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--sources", type=Path, default=DEFAULT_SOURCES)
    parser.add_argument("--store-key", type=str, default="", help="Process only one store_key")
    parser.add_argument("--reuse-stores", action="store_true", help="Use IDs from jockey-registry.json")
    parser.add_argument("--resume", action="store_true", help="Skip assets already indexed_ready in checkpoint")
    parser.add_argument("--write-env", action="store_true", help="Mirror store IDs to .env")
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def new_run_id() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def print_failure_report(
    exc: JockeyApiError,
    telemetry_path: Path,
    completed: int,
    total: int,
    context: dict,
) -> None:
    print("\n" + "=" * 60, file=sys.stderr)
    print(f"FAILURE at step: {exc.step}", file=sys.stderr)
    for key, val in context.items():
        print(f"  {key}: {val}", file=sys.stderr)
    if exc.http_status:
        print(f"  http_status: {exc.http_status}", file=sys.stderr)
    if exc.response_body is not None:
        print(f"  api_error: {exc.response_body}", file=sys.stderr)
    print(f"  telemetry: {telemetry_path}", file=sys.stderr)
    print(f"  completed: {completed}/{total}", file=sys.stderr)
    print("  next_action: fix error, then run: python upload_to_jockey.py --resume", file=sys.stderr)
    print("=" * 60, file=sys.stderr)


def persist_all(
    registry: Registry,
    checkpoint: Checkpoint,
    manifest_path: Path,
    sources_stores: dict,
    manifest_assets: list[dict],
    asset_id: str,
    jockey_block: dict,
) -> None:
    update_manifest_jockey_block(manifest_path, asset_id, jockey_block)
    snapshot = build_snapshot(sources_stores, registry, load_manifest(manifest_path)["assets"])
    write_snapshot(SNAPSHOT_PATH, snapshot)


def resolve_local_path(processing: dict) -> Path:
    rel = processing.get("local_path", "")
    path = ROOT / rel
    if not path.exists():
        raise FileNotFoundError(f"Video file not found: {path}")
    size_mb = path.stat().st_size / (1024 * 1024)
    if size_mb > 200:
        raise ValueError(f"{path} is {size_mb:.1f} MB — exceeds Jockey 200 MB direct upload limit")
    return path


def ensure_store(
    client: JockeyClient,
    registry: Registry,
    telemetry: Telemetry,
    store_key: str,
    store_cfg: dict,
    reuse: bool,
) -> str:
    # Reload registry in case a parallel/resumed run registered this store.
    if registry.path.exists():
        registry.data = Registry(registry.path).data

    existing = registry.get_store_id(store_key)
    if existing:
        telemetry.store_reuse(store_key, existing)
        print(f"  Reusing store {store_key} -> {existing}")
        return existing

    telemetry.store_create_start(store_key, store_cfg["name"])
    t0 = time.monotonic()
    try:
        result, status = client.create_knowledge_store(store_cfg["name"], store_cfg["ingestion_config"])
    except JockeyApiError as exc:
        if exc.http_status == 409 and registry.path.exists():
            fresh = Registry(registry.path)
            existing = fresh.get_store_id(store_key)
            if existing:
                registry.data = fresh.data
                telemetry.store_reuse(store_key, existing)
                print(f"  Reusing store {store_key} -> {existing} (409 conflict)")
                return existing
        raise
    duration_ms = int((time.monotonic() - t0) * 1000)
    store_id = result["_id"]
    registry.set_store(
        store_key,
        store_id,
        store_cfg["name"],
        store_cfg.get("display_name", store_cfg["name"]),
        status,
    )
    telemetry.store_create_ok(store_key, store_id, duration_ms, status)
    print(f"  Created store {store_key} -> {store_id}")
    return store_id


def process_asset(
    client: JockeyClient,
    registry: Registry,
    checkpoint: Checkpoint,
    telemetry: Telemetry,
    manifest_path: Path,
    sources_stores: dict,
    manifest_assets: list[dict],
    asset: dict,
    store_id: str,
) -> None:
    asset_id = asset["id"]
    store_key = asset["store_key"]
    local_path = resolve_local_path(asset["processing"])
    size_mb = local_path.stat().st_size / (1024 * 1024)

    steps: list[str] = []
    timestamps: dict[str, str] = {}

    telemetry.asset_upload_start(asset_id, round(size_mb, 2))
    print(f"  Uploading {size_mb:.1f} MB...")
    t0 = time.monotonic()
    upload_result = client.upload_asset_direct(str(local_path))
    tl_asset_id = upload_result["_id"]
    telemetry.asset_upload_ok(asset_id, tl_asset_id, int((time.monotonic() - t0) * 1000))
    steps.append("asset_uploaded")
    checkpoint.update_asset(asset_id, {"store_key": store_key, "knowledge_store_id": store_id, "asset_id": tl_asset_id})

    poll_count = 0

    def on_asset_poll(status: str, elapsed: float) -> None:
        nonlocal poll_count
        poll_count += 1
        if poll_count == 1 or status == "ready" or poll_count % 6 == 0:
            telemetry.asset_poll(asset_id, tl_asset_id, status, elapsed)

    t_poll = time.monotonic()
    client.poll_asset_ready(tl_asset_id, on_poll=on_asset_poll)
    total_wait = time.monotonic() - t_poll
    telemetry.asset_ready(asset_id, tl_asset_id, total_wait)
    steps.append("asset_ready")
    timestamps["asset_ready_at"] = utc_now_iso()

    telemetry.item_create_start(asset_id, store_id, tl_asset_id)
    t1 = time.monotonic()
    item_result = client.add_store_item(store_id, tl_asset_id)
    item_id = item_result["_id"]
    telemetry.item_create_ok(asset_id, item_id, int((time.monotonic() - t1) * 1000))
    steps.append("item_created")

    item_poll_count = 0

    def on_item_poll(status: str, elapsed: float) -> None:
        nonlocal item_poll_count
        item_poll_count += 1
        if item_poll_count == 1 or status == "ready" or item_poll_count % 3 == 0:
            telemetry.item_poll(asset_id, item_id, status, elapsed)
        print(f"  Indexing: {status} ({elapsed:.0f}s elapsed)", flush=True)

    t_index = time.monotonic()
    client.poll_item_ready(store_id, item_id, on_poll=on_item_poll)
    index_s = time.monotonic() - t_index
    telemetry.item_ready(asset_id, item_id, index_s)
    steps.append("item_ready")
    timestamps["item_ready_at"] = utc_now_iso()

    jockey_block = {
        "knowledge_store_id": store_id,
        "store_key": store_key,
        "asset_id": tl_asset_id,
        "item_id": item_id,
        "asset_status": "ready",
        "item_status": "ready",
        "indexed_at": utc_now_iso(),
    }

    checkpoint.mark_indexed_ready(
        asset_id,
        store_id,
        store_key,
        tl_asset_id,
        item_id,
        steps,
        timestamps,
    )
    persist_all(registry, checkpoint, manifest_path, sources_stores, manifest_assets, asset_id, jockey_block)
    print(f"  Indexed {asset_id} -> asset={tl_asset_id} item={item_id}")


def main() -> int:
    load_dotenv(ROOT / ".env")
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)
        except Exception:
            pass
    args = parse_args()

    sources = load_sources(args.sources)
    stores_cfg = sources["stores"]

    if args.dry_run:
        manifest = load_manifest(args.manifest) if args.manifest.exists() else None
        if not manifest:
            print("Dry-run: manifest missing — run collect_videos.py first", file=sys.stderr)
            return 1
        assets = manifest["assets"]
        if args.store_key:
            assets = [a for a in assets if a["store_key"] == args.store_key]
        print(f"Dry-run: would upload {len(assets)} asset(s)")
        grouped = group_assets_by_store(assets)
        for sk, group in grouped.items():
            print(f"  Store [{sk}]: {len(group)} asset(s)")
            for a in group:
                path = ROOT / a.get("processing", {}).get("local_path", "")
                exists = path.exists()
                size = f"{path.stat().st_size / (1024*1024):.1f} MB" if exists else "MISSING"
                print(f"    {a['id']}: {path.name} ({size})")
        api_key = os.getenv("TL_API_KEY", "")
        print(f"  TL_API_KEY: {'set' if api_key else 'NOT SET'}")
        return 0

    api_key = os.getenv("TL_API_KEY")
    if not api_key:
        print("TL_API_KEY not set. Copy .env.example to .env and add your key.", file=sys.stderr)
        return 1

    manifest_data = load_manifest(args.manifest)
    assets = manifest_data["assets"]
    if args.store_key:
        assets = [a for a in assets if a["store_key"] == args.store_key]

    run_id = new_run_id()
    telemetry = Telemetry(run_id, TELEMETRY_DIR)
    registry = Registry(REGISTRY_PATH)
    checkpoint = Checkpoint(CHECKPOINT_PATH, run_id)
    client = JockeyClient(api_key)

    store_keys = sorted({a["store_key"] for a in assets})
    telemetry.run_start(str(args.manifest), len(assets), store_keys)
    run_start = time.monotonic()
    indexed = 0

    try:
        grouped = group_assets_by_store(assets)
        reuse = args.reuse_stores or args.resume or REGISTRY_PATH.exists()

        for store_key in sorted(grouped.keys()):
            store_cfg = stores_cfg[store_key]
            group = grouped[store_key]
            pending = [a for a in group if not (args.resume and checkpoint.is_indexed_ready(a["id"]))]
            if not pending:
                print(f"\nStore [{store_key}]: all {len(group)} asset(s) already indexed — skipping")
                continue

            print(f"\n=== Store [{store_key}] ({len(pending)} to process) ===")
            store_id = ensure_store(client, registry, telemetry, store_key, store_cfg, reuse)

            for asset in pending:
                print(f"\n--- Asset {asset['id']} ---")
                context = {
                    "asset_id": asset["id"],
                    "store_key": store_key,
                    "knowledge_store_id": store_id,
                }
                try:
                    process_asset(
                        client,
                        registry,
                        checkpoint,
                        telemetry,
                        args.manifest,
                        stores_cfg,
                        manifest_data["assets"],
                        asset,
                        store_id,
                    )
                    indexed += 1
                except JockeyApiError as exc:
                    exc.context.update(context)
                    telemetry.step_failure(
                        step=exc.step,
                        asset_id=asset["id"],
                        store_key=store_key,
                        knowledge_store_id=store_id,
                        http_status=exc.http_status,
                        api_error=exc.response_body,
                    )
                    print_failure_report(exc, telemetry.path, checkpoint.completed_count(), len(assets), context)
                    return 1

        if args.write_env:
            write_env_store_ids(ENV_PATH, registry.all_store_ids())
            print(f"Updated {ENV_PATH} with KNOWLEDGE_STORE_IDS")

        telemetry.run_complete(indexed, time.monotonic() - run_start, store_keys)
        snapshot = build_snapshot(stores_cfg, registry, load_manifest(args.manifest)["assets"])
        write_snapshot(SNAPSHOT_PATH, snapshot)
        print(f"\nDone. Indexed {indexed} asset(s) this run.")
        print(f"  Registry: {REGISTRY_PATH}")
        print(f"  Snapshot: {SNAPSHOT_PATH}")
        print(f"  Telemetry: {telemetry.path}")
        return 0

    except JockeyApiError as exc:
        telemetry.step_failure(step=exc.step, api_error=str(exc))
        print_failure_report(exc, telemetry.path, checkpoint.completed_count(), len(assets), exc.context)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
