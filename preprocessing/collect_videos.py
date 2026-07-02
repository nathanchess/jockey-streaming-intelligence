#!/usr/bin/env python3
"""Download videos from library-sources.json and optimize for Jockey direct upload."""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path

import yt_dlp

from lib.manifest import (
    build_manifest_entry,
    build_youtube_metadata,
    enrich_asset_from_store,
    load_sources,
    merge_manifest_assets,
    validate_sources,
)

ROOT = Path(__file__).resolve().parent
DEFAULT_SOURCES = ROOT / "data" / "library-sources.json"
DEFAULT_OUTPUT = ROOT / "videos"
DEFAULT_MANIFEST = ROOT / "data" / "library-manifest.json"


def configure_stdout() -> None:
    """Avoid Windows cp1252 crashes on YouTube titles with emoji."""
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Collect and optimize demo videos for Jockey upload.")
    parser.add_argument("--sources", type=Path, default=DEFAULT_SOURCES)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--max-mb", type=float, default=180.0)
    parser.add_argument("--ids", type=str, default="", help="Comma-separated asset ids subset")
    parser.add_argument("--skip-existing", action="store_true", help="Skip if output mp4 exists and is under max-mb")
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def probe_duration_sec(path: Path) -> float | None:
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "csv=p=0",
        str(path),
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return float(result.stdout.strip())
    except (subprocess.CalledProcessError, FileNotFoundError, ValueError):
        return None


def probe_resolution(path: Path) -> str | None:
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height",
        "-of",
        "csv=s=x:p=0",
        str(path),
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return result.stdout.strip() or None
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None


def file_size_mb(path: Path) -> float:
    return path.stat().st_size / (1024 * 1024)


def _cleanup_encode_temps(output_path: Path) -> None:
    for stale in output_path.parent.glob(f"{output_path.stem}.*.mp4"):
        if stale != output_path:
            stale.unlink(missing_ok=True)


def run_ffmpeg_with_progress(cmd: list[str], duration_sec: float | None) -> None:
    """Run ffmpeg, printing time progress when duration is known."""
    print(f"  ffmpeg: {' '.join(cmd[:8])}...")
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    time_re = re.compile(r"out_time_ms=(\d+)")
    assert proc.stdout is not None
    for line in proc.stdout:
        if duration_sec and duration_sec > 0:
            match = time_re.search(line)
            if match:
                elapsed = int(match.group(1)) / 1_000_000
                pct = min(100.0, elapsed / duration_sec * 100)
                print(f"\r  Encoding: {pct:5.1f}% ({elapsed:.0f}s / {duration_sec:.0f}s)", end="", flush=True)
    proc.wait()
    if proc.returncode != 0:
        raise subprocess.CalledProcessError(proc.returncode, cmd)
    if duration_sec:
        print()


def remux_copy(input_path: Path, output_path: Path) -> None:
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(input_path),
        "-c",
        "copy",
        "-movflags",
        "+faststart",
        str(output_path),
    ]
    run_ffmpeg_with_progress(cmd, probe_duration_sec(input_path))


def encode_target_bitrate(
    input_path: Path,
    output_path: Path,
    *,
    scale_height: int,
    video_bps: int,
    duration_sec: float | None,
) -> None:
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(input_path),
        "-vf",
        f"scale=-2:{scale_height}",
        "-c:v",
        "libx264",
        "-b:v",
        str(video_bps),
        "-maxrate",
        str(int(video_bps * 1.25)),
        "-bufsize",
        str(int(video_bps * 2)),
        "-preset",
        "fast",
        "-c:a",
        "aac",
        "-b:a",
        "96k",
        "-movflags",
        "+faststart",
        "-progress",
        "pipe:1",
        "-nostats",
        str(output_path),
    ]
    run_ffmpeg_with_progress(cmd, duration_sec)


def optimize_video(input_path: Path, output_path: Path, max_mb: float) -> dict:
    _cleanup_encode_temps(output_path)
    input_mb = file_size_mb(input_path)
    duration_sec = probe_duration_sec(input_path)

    if input_mb <= max_mb:
        remux_copy(input_path, output_path)
        return {
            "local_path": str(output_path.relative_to(ROOT)),
            "file_size_mb": round(file_size_mb(output_path), 2),
            "resolution": probe_resolution(output_path),
            "encode_strategy": "remux_copy",
            "source_size_mb": round(input_mb, 2),
        }

    if not duration_sec or duration_sec <= 0:
        raise RuntimeError(f"Could not probe duration for {input_path.name}")

    # Target bitrate from duration so long episodes fit in one pass (~minutes, not hours).
    max_bytes = max_mb * 1024 * 1024
    audio_bps = 96_000
    overhead_bps = 32_000
    target_total_bps = (max_bytes * 8) / duration_sec
    video_bps = max(180_000, int(target_total_bps - audio_bps - overhead_bps))

    if duration_sec > 1200:
        scale_steps = [720, 480]
    elif duration_sec > 600:
        scale_steps = [720, 540]
    else:
        scale_steps = [1080, 720]

    last_error: Exception | None = None
    for scale in scale_steps:
        adjusted_bps = video_bps if scale >= 720 else int(video_bps * 0.85)
        tmp = output_path.with_suffix(f".enc.h{scale}.mp4")
        try:
            print(
                f"  Compressing {input_mb:.0f} MB -> target {max_mb:.0f} MB "
                f"({duration_sec/60:.0f} min, {scale}p, {adjusted_bps//1000}k video)"
            )
            encode_target_bitrate(
                input_path, tmp, scale_height=scale, video_bps=adjusted_bps, duration_sec=duration_sec
            )
            size = file_size_mb(tmp)
            if size <= max_mb:
                shutil.move(str(tmp), str(output_path))
                return {
                    "local_path": str(output_path.relative_to(ROOT)),
                    "file_size_mb": round(size, 2),
                    "resolution": probe_resolution(output_path),
                    "encode_strategy": f"h264_{adjusted_bps//1000}k_scale{scale}",
                    "source_size_mb": round(input_mb, 2),
                }
            print(f"  Still {size:.1f} MB at {scale}p — trying lower scale/bitrate")
            tmp.unlink(missing_ok=True)
        except subprocess.CalledProcessError as exc:
            last_error = exc
            tmp.unlink(missing_ok=True)

    raise RuntimeError(
        f"Could not compress {input_path.name} under {max_mb} MB. "
        f"Add clip_start/clip_end in library-sources.json. Last error: {last_error}"
    )


def build_base_ydl_opts() -> dict:
    """YouTube now requires a JS runtime + EJS solver; Node is available on this machine."""
    return {
        "js_runtimes": {"node": {}},
        "remote_components": ["ejs:github"],
        "noplaylist": True,
        "retries": 5,
        "fragment_retries": 5,
        "retry_sleep_functions": {"http": lambda n: min(30, 2**n)},
    }


def build_ydl_opts(asset: dict, tmp_dir: Path) -> dict:
    opts: dict = {
        **build_base_ydl_opts(),
        "format": "bestvideo+bestaudio/best",
        "merge_output_format": "mp4",
        "outtmpl": str(tmp_dir / f"{asset['id']}.%(ext)s"),
        "quiet": False,
        "no_warnings": False,
    }
    if asset.get("clip_start") and asset.get("clip_end"):
        opts["download_sections"] = f"*{asset['clip_start']}-{asset['clip_end']}"
    return opts


def extract_info(url: str) -> dict:
    with yt_dlp.YoutubeDL({"quiet": True, **build_base_ydl_opts()}) as ydl:
        return ydl.extract_info(url, download=False)


def download_video(asset: dict, tmp_dir: Path) -> Path:
    tmp_dir.mkdir(parents=True, exist_ok=True)
    formats = ["bestvideo+bestaudio/best", "best"]
    last_error: Exception | None = None
    for fmt in formats:
        opts = build_ydl_opts(asset, tmp_dir)
        opts["format"] = fmt
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(asset["url"], download=True)
                path = Path(ydl.prepare_filename(info))
                if path.suffix != ".mp4":
                    mp4 = path.with_suffix(".mp4")
                    if mp4.exists():
                        path = mp4
                if not path.exists():
                    candidates = list(tmp_dir.glob(f"{asset['id']}.*"))
                    if not candidates:
                        raise FileNotFoundError(f"Download failed for {asset['id']}")
                    path = candidates[0]
                if fmt != formats[0]:
                    print(f"  Downloaded with fallback format: {fmt}")
                return path
        except yt_dlp.utils.DownloadError as exc:
            last_error = exc
            if fmt == formats[-1]:
                raise
            print(f"  Format {fmt!r} failed ({exc}); retrying with {formats[-1]!r}")
    raise last_error or RuntimeError(f"Download failed for {asset['id']}")


def main() -> int:
    configure_stdout()
    args = parse_args()
    data = load_sources(args.sources)
    stores = data["stores"]
    assets = [enrich_asset_from_store(a, stores) for a in data["assets"]]

    if args.ids.strip():
        wanted = {x.strip() for x in args.ids.split(",") if x.strip()}
        assets = [a for a in assets if a["id"] in wanted]
        if not assets:
            print(f"No assets matched --ids {args.ids}", file=sys.stderr)
            return 1

    args.output_dir.mkdir(parents=True, exist_ok=True)
    tmp_dir = args.output_dir / ".tmp"

    if args.dry_run:
        print(f"Would process {len(assets)} asset(s) -> {args.output_dir} (max {args.max_mb} MB)")
        for asset in assets:
            print(f"  [{asset['store_key']}] {asset['id']}: {asset['url']}")
        validate_sources(data)
        print("Manifest validation OK.")
        return 0

    entries: list[dict] = []
    failures: list[str] = []
    for asset in assets:
        print(f"\n=== {asset['id']} ({asset['series']}) ===")
        out_path = args.output_dir / f"{asset['id']}.mp4"

        try:
            if args.skip_existing and out_path.exists() and file_size_mb(out_path) <= args.max_mb:
                print(f"  Skipping — already exists ({file_size_mb(out_path):.1f} MB)")
                info = extract_info(asset["url"])
                youtube_meta = build_youtube_metadata(info, asset)
                processing = {
                    "local_path": str(out_path.relative_to(ROOT)),
                    "file_size_mb": round(file_size_mb(out_path), 2),
                    "resolution": probe_resolution(out_path),
                    "encode_strategy": "skipped_existing",
                    "source_size_mb": round(file_size_mb(out_path), 2),
                }
                entries.append(build_manifest_entry(asset, youtube_meta, processing))
                continue

            info = extract_info(asset["url"])
            youtube_meta = build_youtube_metadata(info, asset)
            print(f"  Title: {youtube_meta.get('original_title')}")
            print(f"  Duration: {youtube_meta.get('duration_sec')}s")

            raw_path = download_video(asset, tmp_dir)
            print(f"  Downloaded: {raw_path} ({file_size_mb(raw_path):.1f} MB)")

            processing = optimize_video(raw_path, out_path, args.max_mb)
            print(f"  Optimized: {out_path} ({processing['file_size_mb']} MB, {processing['encode_strategy']})")

            entry = build_manifest_entry(asset, youtube_meta, processing)
            entries.append(entry)
        except Exception as exc:
            print(f"  FAILED: {exc}", file=sys.stderr)
            failures.append(asset["id"])

    if entries:
        merge_manifest_assets(args.manifest, entries, stores)
        print(f"\nWrote manifest: {args.manifest} ({len(entries)} asset(s))")
    if failures:
        print(f"\nFailed {len(failures)} asset(s): {', '.join(failures)}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
