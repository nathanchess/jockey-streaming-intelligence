# Preprocessing Pipeline

Offline scripts to download demo videos, optimize for Jockey direct upload (≤200 MB), and ingest into **separate knowledge stores per series**.

## Prerequisites

- Python 3.11+
- [ffmpeg](https://ffmpeg.org/) on PATH (`winget install ffmpeg` on Windows)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) JS runtime (Deno recommended) for YouTube — see [EJS wiki](https://github.com/yt-dlp/yt-dlp/wiki/EJS)

## Setup

```powershell
cd preprocessing
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# Edit .env and set TL_API_KEY
```

## Run order

```powershell
# 1. Validate manifest
python collect_videos.py --dry-run

# 2. Test download (recommended before full batch)
python collect_videos.py --ids hk-ep01,chef-ep01

# 3. Download all 18 assets
python collect_videos.py

# 4. Validate upload inputs
python upload_to_jockey.py --dry-run

# 5. Upload + index (expensive — fail-fast on errors)
python upload_to_jockey.py

# After a failure, fix the issue then resume without re-indexing completed assets:
python upload_to_jockey.py --resume
```

## Knowledge stores (4 series)

| store_key | Series | Vertical |
|-----------|--------|----------|
| `hells_kitchen` | Hell's Kitchen | fast |
| `lizzie_bennet` | The Lizzie Bennet Diaries | micro_drama |
| `omeleto_reserve` | The Reserve (Omeleto) | micro_drama |
| `french_chef` | The French Chef (Julia Child) | archive |

One knowledge store per `store_key`. IDs are persisted in:

- `output/jockey-registry.json` — **commit this** (authoritative store IDs)
- `output/checkpoint.json` — resume state
- `data/library-manifest.json` — per-asset `jockey` block
- `output/jockey-snapshot.json` — backend bootstrap

Telemetry: `output/telemetry/{run_id}.jsonl`

## Git policy

- **Commit:** `jockey-registry.json`, `jockey-snapshot.json`, `library-manifest.json` (with IDs)
- **Ignore:** `videos/`, `.env`, telemetry JSONL

## Troubleshooting

- File still >200 MB after ffmpeg → lower `--max-mb` or add `clip_start`/`clip_end` in `library-sources.json`
- Hell's Kitchen episodes are long; ffmpeg compresses to ≤180 MB (quality tradeoff for Jockey direct upload)
- Lost store ID → read `output/jockey-registry.json`, never rely on console output alone

## Out of scope

Metadata hydration via `POST /responses` — follow-up backend phase per PRD.
