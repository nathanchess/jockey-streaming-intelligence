## 🎯 Objective

Build a lightweight demo application that shows enterprise streaming buyers how TwelveLabs Jockey turns a messy video library into a searchable, programmable, and personalized content engine. The app combines four Jockey capabilities in a single, executive-friendly workflow: metadata hydration, semantic search, personalized discovery, and smart programming. It is designed to run in a 5–10 minute live demo and leave buyers with a clear picture of the ROI TwelveLabs unlocks from their existing assets.

The demo targets delivery pre-Jockey GA (August 2026), deployed and demo-ready for Sales and Field Engineering by the end of July 2026.

---

## 😢 Problem Statement

Streaming platforms — FAST operators, studios, and micro-drama publishers — sit on enormous libraries of video content they cannot fully exploit. Metadata is incomplete ("Swiss cheese"), archives are unsearchable, personalization is shallow, and FAST channel programming is largely manual. The result: content that cost millions to produce generates a fraction of its potential revenue.

1. **Metadata is Swiss cheese**: Assets arrive with title-only or partial labels. Genre, mood, characters, scene types, and audio events are missing — making most of the library invisible to recommendation engines.
2. **Archives are unsearchable**: Without semantic understanding, finding a specific moment ("the scene where someone laughs nervously") requires scrubbing timelines manually. Thousands of hours of B-roll and archival footage are effectively dark.
3. **Personalization is shallow**: Recommendation models depend on clean metadata and behavioral signals they don't have. Content rails are built from show titles, not from the specific vibe or context inside the video.
4. **FAST programming is manual**: Channel blocks are assembled by hand — somebody finds clips, checks runtimes, writes the lineup. This doesn't scale across dozens of channels and rotating inventories.

### Why Existing Solutions Fall Short

- **Keyword search**: Misses non-verbal cues like body language, tone of voice, and silence. Returns irrelevant matches based on text fields, not what's actually in the video.
- **Frame-based CV pipelines**: Identify "person" or "car" but not "tension" or "luxury aesthetic." Expensive to operate and miss narrative context.
- **Generic LLM approaches**: Rely on sparse sampling and do not handle time/motion well. Often hallucinate or fail to provide precise timestamps for actionable results.
- **Metadata vendors / AI tagging tools**: Extract frame-level labels but miss narrative context — character relationships, scene dynamics, audio mood — across episodes and libraries. Tags alone don't power cross-catalog recommendations or FAST programming.

### Technical Differentiation

TwelveLabs provides a purpose-built **multimodal video intelligence layer** with two complementary capability tiers:

| Tier | APIs | Best For |
| --- | --- | --- |
| **Models** | Marengo (Search/Embed), Pegasus (Analyze) | Per-scene analysis, semantic search within a video, vector embeddings |
| **Agents (Jockey)** | Responses API + Knowledge Stores | Cross-episode reasoning, entity tracking, natural language corpus queries, multi-turn personalization |

This demo focuses on **Jockey (Agents API)** as the unified layer that reasons across entire video collections — hydrating metadata, finding moments by describing them, generating personalized rails, and assembling FAST channel lineups from a single API.

---

## 🗣️ Target Customers

Primary targets are **streaming platforms, FAST operators, studios, and micro-drama publishers** looking to unlock revenue from video archives they've already paid for.

- **Co-Design Partners**: Roku, South Park Digital Studios, Netflix, Cineverse
- **Secondary**: VOD platforms, AVOD publishers, content archive operators

**Customer Requirements**

1. **Automated Metadata Hydration**: Turn a library of poorly-labeled assets into a fully searchable catalog — genres, moods, characters, scene types, audio events, topic tags — in a fraction of the time manual tagging takes.
2. **Semantic Search**: Find any scene, sound, or moment across the entire library using natural language, in seconds. Not just keywords — real understanding of what's inside the video.
3. **Personalized Discovery**: Generate viewer-specific content rails from a natural-language intent description (mood, genre, length, audience type) that a downstream recommendation system can consume.
4. **Smart FAST Programming**: Input a channel theme or demographic target and output a structured FAST channel lineup — episodes/clips sequenced with runtime estimates and lead-in/out notes — ready to push to an EPG system.

---

## 🎨 User Interaction & Design

**Mock UI components (demo-first):**

1. **Library View**: Asset grid showing the "messy" state (thin/missing metadata) with a before/after toggle revealing Jockey-hydrated metadata (genre, mood, characters, scene types, audio events, topic tags).
2. **Semantic Search Bar**: Natural-language input that finds scenes, sounds, and moments across the library. Results include asset reference, timestamp, description of match, and relevance rating. Follow-up refinement via multi-turn session ("now find all scenes with a similar emotional tone").
3. **Personalized Discovery Panel**: Viewer intent input ("Looking for feel-good content, family-friendly, under 20 min") → ranked content rail with clip references, rationale per item, and match signals. Toggle viewer profile to show how the rail changes.
4. **Smart Programming Panel**: FAST channel brief input (theme, target demographic, total runtime) → sequenced channel lineup output with runtime estimates and programming notes. One-click JSON export.
5. **Developer View Toggle**: Shows the raw Jockey API request/response — endpoint, payload, and structured output schema — alongside the visual UI for technical buyers.
6. **NL Feed Query (Optional)**: Free-text input powered by Jockey Responses API. Users can type "Show me the most chaotic moments from this season" and get a curated feed returned as structured JSON.

### Demo Flow

```
[1. Load Library]
  → Show 10-20 pre-indexed sample assets (mix of FAST clips, micro-drama footage, long-form archive)
  → "Messy" state: thin/missing metadata, no tags, no discoverability

[2. Jockey Ingests & Hydrates]
  → Jockey indexes the knowledge store with streaming-specific ingestion config
  → Before/after metadata comparison panel
  → "Wow moment" in first 60 seconds

[3. Semantic Search]
  → User types: "find the confrontation scene with the woman in the red dress"
  → Results with timestamps, clip previews, and match confidence
  → Follow-up turn: "now find all scenes with a similar emotional tone"

[4. Personalized Discovery]
  → User inputs viewer intent: "Looking for feel-good content, family-friendly, under 20 min"
  → Jockey returns a ranked content rail with rationale
  → Toggle viewer profile to show how the rail changes

[5. Smart Programming]
  → User inputs FAST channel brief: "Weeknight drama block, 18-34 female demo, 90 min total"
  → Jockey outputs a channel lineup with episodes/clips sequenced with runtime + lead-in/out notes
  → One-click export as JSON
```

### Viewer Profile Selector (Mocked)

| Profile Name | Intent | Demo Target |
| --- | --- | --- |
| "Feel-Good Family" | Uplifting, family-friendly, under 20 min | Roku / Discovery buyers |
| "Suspense Seeker" | Tense, strong female lead, under 30 min | Netflix / personalization leads |
| "FAST Programmer" | 90-min drama block, 18-34 female demo | Cineverse / FAST operators |

---

## 🤔 Requirements

### Pre-Processing Pipeline (Offline)

| Requirement | Specification |
| --- | --- |
| **Input Content** | 10–20 sample streaming assets (mix of FAST clips, micro-drama footage, long-form archive excerpts), rights-cleared or public-domain |
| **Asset Upload** | Upload via `POST /assets` (URL method up to 2 GB, direct up to 200 MB). Poll until `status == "ready"` |
| **Knowledge Store** | Create one knowledge store per demo library via `POST /knowledge-stores` with streaming-specific ingestion config |
| **Ingestion Config** | Characters, moods, genre signals, scene types, audio events, topic tags, production quality, episode structure, thematic arcs, pacing, lead-in/out cues |
| **Metadata Hydration** | Use Jockey `POST /responses` to hydrate thin metadata: genre, mood, characters, scene types, audio events, topic tags |
| **Semantic Search** | All modalities (visual, audio, text on screen) — Jockey corpus-level natural language search |
| **Personalization** | Audience signals, emotional tone, content length, format, viewer demographics |
| **Smart Programming** | Episode structure, thematic arcs, pacing, lead-in/out cues — FAST lineup or micro-drama playlist generation |
| **Output** | JSON manifest per capability with all structured metadata; one-click JSON export for integration-ready output |

### Priority Matrix

| **Requirement** | **Priority** | **Notes / Jockey API** |
| --- | --- | --- |
| Pre-indexed demo assets with metadata hydration available instantly | **P0** | Knowledge store pre-built offline; before/after metadata toggle in UI |
| Natural-language semantic search across the full library | **P0** | `POST /responses` with search schema; multi-turn session support |
| Personalized content rail from viewer intent description | **P0** | `POST /responses` with discovery schema; structured JSON output |
| FAST channel lineup generation from channel brief | **P0** | `POST /responses` with programming schema; runtime ±10% of target |
| Developer View toggle (raw API request/response) | **P0** | Frontend toggle showing endpoint, payload, and schema |
| Before/after metadata comparison panel | **P0** | Display hydrated metadata alongside original thin/missing records |
| Viewer profile selector (mocked) | **P0** | Toggle between persona profiles to show how rails change |
| Micro-drama assembly from archival footage | **P1** | Scene-by-scene outline with clip references; multi-turn refinement |
| Discoverability improvement metric (ROI calculator) | **P1** | % of assets now fully tagged vs. before; ROI calculator input |
| Swappable sample libraries per vertical (FAST, micro-drama, archive, sports) | **P2** | FE can swap datasets to match customer vertical |
| Shareable demo link for async follow-up | **P2** | Post-meeting value demonstration continues without SE present |

---

## 🧠 Architecture Workflows

### Workflow 1: Library Ingest & Metadata Hydration

**User Story**: *As a Sales Engineer, I need to show a messy library transformed into a fully searchable catalog so that the VP of Content Operations immediately sees how Jockey replaces manual tagging work.*

1. Pre-index 10–20 sample assets into a knowledge store with streaming-specific ingestion config (offline, before demo).
2. Show the "messy" state: assets with title-only or missing metadata.
3. Toggle to reveal Jockey-hydrated metadata: genre, mood, characters, scene types, audio events, topic tags.
4. Display before/after comparison panel as the "wow moment" in the first 60 seconds.

**Technical Notes**

- Knowledge store is pre-indexed offline; demo only queries, not ingestion.
- `ingestion_config` is immutable after creation — plan the schema carefully.

### Workflow 2: Semantic Search

**User Story**: *As a Field Engineer, I want to run natural-language searches across video and audio so that I can demonstrate to archive customers that they can find any sound or scene in seconds.*

1. User types a free-text natural language query (e.g., "find the confrontation scene with the woman in the red dress").
2. Backend sends `POST /responses` with the query, `knowledge_store_id`, and search-specific `instructions`.
3. Results appear with asset reference, timestamps, description of match, and relevance rating.
4. Follow-up refinement via multi-turn session ("now find all scenes with a similar emotional tone") using `session_id`.

### Workflow 3: Personalized Content Discovery

**User Story**: *As a Field Engineer, I want to input a viewer intent and receive a personalized content rail so that I can demonstrate personalization value to discovery-focused buyers.*

1. User inputs a plain-language viewer intent (mood, genre, length preference, audience type).
2. Backend sends `POST /responses` with discovery-specific `instructions` and structured output schema.
3. Jockey returns a ranked content rail with clip references, rationale per item, and match signals.
4. Toggle viewer profile to show how the rail changes with different intent.
5. Results are returned in structured JSON consumable by a downstream recommendation system.

### Workflow 4: Smart FAST Programming

**User Story**: *As a Field Engineer, I want to input a FAST channel brief and receive a ready-to-program channel lineup so that I can demonstrate FAST monetization value to operators.*

1. User inputs a channel brief: theme, target demographic, total runtime.
2. Backend sends `POST /responses` with programming-specific `instructions` and FAST lineup schema.
3. Jockey outputs a sequenced lineup: episode/clip title, start timestamp, duration, programming rationale, lead-in/out notes.
4. Total runtime of generated lineup matches the input target (within ±10%).
5. One-click export as JSON (integration-ready for EPG systems).

### Workflow 5: Micro-Drama Assembly (P1)

**User Story**: *As a Field Engineer, I want to demonstrate micro-drama assembly from archival footage so that I can address interest in generating new short-form content from existing assets.*

1. User inputs a micro-drama brief (conflict type, character count, target duration).
2. Jockey outputs a scene-by-scene outline with clip references and timestamps from the library.
3. Multi-turn refinement supported ("make the conflict sharper") via `session_id`.

### Data Flow (Demo Mode)

1. Pre-indexed knowledge store with sample assets (eliminates live ingestion wait in demo)
2. User triggers a capability (search query, intent input, channel brief)
3. Backend constructs a `POST /responses` request with appropriate `instructions` + `text.format` schema
4. Jockey returns structured JSON response
5. Backend parses and formats for display
6. Frontend renders results alongside optional raw API view (Developer Mode toggle)
7. Multi-turn follow-up queries pass `session_id` for context continuity

---

## 📏 TwelveLabs API Integration

### Architecture: Jockey-Only (Agents API)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  JOCKEY (AGENTS API) — Unified Corpus-Level Reasoning                    │
│  Knowledge Store → POST /responses → Structured JSON / Multi-turn        │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Assets API                                                         │  │
│  │  POST /assets → Poll until ready                                    │  │
│  │  POST /knowledge-stores → POST /knowledge-stores/{id}/items         │  │
│  │  Poll until indexed                                                 │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                          │                                               │
│                          ▼                                               │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Responses API (jockey1.0)                                          │  │
│  │  POST /responses → Structured JSON output per capability schema    │  │
│  │  • Metadata Hydration     • Semantic Search                        │  │
│  │  • Personalized Discovery  • Smart FAST Programming                 │  │
│  │  • Micro-Drama Assembly (P1)                                        │  │
│  │  Reuse session_id for multi-turn refinement                         │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

**Decision logic for which layer to use:**

| Task | Recommended API | Reason |
| --- | --- | --- |
| Hydrate metadata for a library of assets | Jockey Responses API | Corpus-level reasoning; enriches and structures metadata across the whole library in one call |
| Find a specific scene or moment across the library | Jockey Responses API | Natural-language corpus-level semantic search; no per-video calls needed |
| Generate a personalized content rail from viewer intent | Jockey Responses API | NL intent → ranked rail with structured JSON output |
| Generate a FAST channel lineup from a brief | Jockey Responses API | Corpus-level sequencing; outputs structured lineup with runtime + rationale |
| Refine a rail or lineup with follow-up prompts | Jockey Responses API + `session_id` | Multi-turn conversation; no re-querying required |

### Phase 1: Asset Upload & Knowledge Store Setup

```python
import requests
import time

API_KEY = "<YOUR_API_KEY>"
BASE_URL = "https://api.twelvelabs.io/v1.3"
HEADERS = {"x-api-key": API_KEY}

# Upload a video as an asset
response = requests.post(
    f"{BASE_URL}/assets",
    headers=HEADERS,
    files=[("method", (None, "url")), ("url", (None, "<EPISODE_URL>"))]
)
asset_id = response.json()["_id"]

# Poll until ready
while True:
    status = requests.get(f"{BASE_URL}/assets/{asset_id}", headers=HEADERS).json()["status"]
    if status == "ready": break
    time.sleep(5)

# Create a knowledge store for the demo library
response = requests.post(
    f"{BASE_URL}/knowledge-stores",
    headers={**HEADERS, "Content-Type": "application/json"},
    json={
        "name": "streaming-intel-demo-library",
        "ingestion_config": {
            "enrichment_config": {
                "type": "description",
                "description": "Extract characters, moods, genre signals, scene types, audio events, topic tags, episode structure, thematic arcs, pacing, and production quality for a streaming platform catalog."
            }
        }
    }
)
store_id = response.json()["_id"]

# Add asset to knowledge store and poll
response = requests.post(
    f"{BASE_URL}/knowledge-stores/{store_id}/items",
    headers={**HEADERS, "Content-Type": "application/json"},
    json={"asset_id": asset_id}
)
item_id = response.json()["_id"]
while True:
    status = requests.get(
        f"{BASE_URL}/knowledge-stores/{store_id}/items/{item_id}", headers=HEADERS
    ).json()["status"]
    if status == "ready": break
    time.sleep(10)
```

### Phase 2: Metadata Hydration (Jockey Responses API)

```python
response = requests.post(
    f"{BASE_URL}/responses",
    headers={**HEADERS, "Content-Type": "application/json"},
    json={
        "model": "jockey1.0",
        "instructions": "You are a streaming content catalog manager. Extract structured metadata for each asset: genre, mood, characters, scene types, audio events, topic tags, content rating signal, and a summary.",
        "input": [
            {
                "type": "message",
                "role": "user",
                "content": "Hydrate metadata for all assets in this library. Return one record per asset."
            }
        ],
        "knowledge_store_id": store_id,
        "text": {
            "format": {
                "type": "json_schema",
                "name": "metadata_hydration",
                "schema": HYDRATION_SCHEMA  # See Appendix
            }
        }
    }
)
```

### Phase 3: Semantic Search & Personalized Discovery

```python
# Semantic search
search_response = requests.post(
    f"{BASE_URL}/responses",
    headers={**HEADERS, "Content-Type": "application/json"},
    json={
        "model": "jockey1.0",
        "instructions": "You are a streaming video search engine. Find scenes matching the user query across the library. Return timestamped results with match type and relevance.",
        "input": [{"type": "message", "role": "user", "content": "find the confrontation scene with the woman in the red dress"}],
        "knowledge_store_id": store_id,
        "session_id": session_id,  # Omit for new session; reuse for multi-turn
        "text": {"format": {"type": "json_schema", "name": "semantic_search", "schema": SEARCH_SCHEMA}}
    }
)

# Personalized discovery rail
discovery_response = requests.post(
    f"{BASE_URL}/responses",
    headers={**HEADERS, "Content-Type": "application/json"},
    json={
        "model": "jockey1.0",
        "instructions": "You are a streaming content recommendation engine. Generate a ranked content rail matching the viewer's intent description.",
        "input": [{"type": "message", "role": "user", "content": viewer_intent}],
        "knowledge_store_id": store_id,
        "text": {"format": {"type": "json_schema", "name": "personalized_discovery", "schema": DISCOVERY_SCHEMA}}
    }
)
```

### Phase 4: Smart FAST Programming (Jockey Responses API)

```python
programming_response = requests.post(
    f"{BASE_URL}/responses",
    headers={**HEADERS, "Content-Type": "application/json"},
    json={
        "model": "jockey1.0",
        "instructions": "You are a FAST channel programmer. Generate a sequenced channel lineup from the brief. Ensure total runtime matches target within ±10%. Include programming rationale and lead-in/out notes.",
        "input": [{"type": "message", "role": "user", "content": channel_brief}],
        "knowledge_store_id": store_id,
        "text": {
            "format": {
                "type": "json_schema",
                "name": "fast_programming",
                "schema": PROGRAMMING_SCHEMA  # See Appendix
            }
        }
    }
)
```

### API Constraints & Considerations

| Parameter | Specification |
| --- | --- |
| **Asset upload (direct)** | Max 200 MB |
| **Asset upload (URL)** | Max 2 GB |
| **Knowledge store model** | `jockey1.0` |
| **Knowledge store items** | Poll until `status == "ready"` before querying |
| **Ingestion config** | Immutable after knowledge store creation — plan schema carefully |
| **Session continuity** | Reuse `session_id` for multi-turn feed refinement |
| **Structured output** | Pass JSON Schema in `text.format` field |
| **Streaming** | Set `stream: true` in request body + HTTP client |
| **Jockey availability** | Private beta — contact account team for access |
| **Jockey webhooks** | Not available in beta; polling only |
| **Jockey deployment** | SaaS only; no on-premise during beta — note limitation for data residency |
| **Single store per request** | Each `/responses` call requires exactly one `knowledge_store_id` |
| **Rate limits** | May differ from Models APIs during beta; build 429 retry with exponential backoff |

## ✅ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STREAMING INTELLIGENCE DEMO ENGINE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────────────────────────────────────────┐  │
│  │    INPUTS    │     │              TWELVELABS LAYER                    │  │
│  │ ┌──────────┐ │     │   ┌──────────────────────────────────────────┐   │  │
│  │ │ Sample   │ │────▶│   │      Jockey (Agents API)                  │   │  │
│  │ │ Video    │ │     │   │                                          │   │  │
│  │ │ Library  │ │     │   │  POST /assets                             │   │  │
│  │ └──────────┘ │     │   │  POST /knowledge-stores                  │   │  │
│  │ ┌──────────┐ │     │   │  POST /knowledge-stores/{id}/items        │   │  │
│  │ │ Viewer   │ │     │   │  POST /responses (jockey1.0)              │   │  │
│  │ │ Intent / │ │     │   │                                          │   │  │
│  │ │ Channel  │ │     │   │  • Metadata Hydration                     │   │  │
│  │ │ Brief    │ │     │   │  • Semantic Search                        │   │  │
│  │ └──────────┘ │     │   │  • Personalized Discovery                 │   │  │
│  └──────┬───────┘     │   │  • Smart FAST Programming                │   │  │
│         │             │   │  • Micro-Drama Assembly (P1)              │   │  │
│         │             │   └──────────────────────────────────────────┘   │  │
│         │             └───────────────────────┬──────────────────────────┘  │
│         │                                     │                             │
│         └────────────────────────────────────▶│                             │
│                                               ▼                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                       DEMO APPLICATION                               │   │
│  │   ┌──────────────┐   ┌──────────────────────┐  ┌─────────────────┐  │   │
│  │   │   Library    │   │  Search & Discovery  │  │  Programming    │  │   │
│  │   │   View       │──▶│  Panel               │  │  Panel          │  │   │
│  │   │ (Before/After)│  │  [NL Search]        │  │  [FAST Lineup]  │  │   │
│  │   └──────────────┘   │  [Content Rails]    │  │  [JSON Export]  │  │   │
│  │                      └──────────────────────┘  └─────────────────┘  │   │
│  │   ┌──────────────────────────────────────────────────────────────┐   │   │
│  │   │  Developer View Toggle  |  Session Manager  |  Schema Library  │   │   │
│  │   └──────────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Components

**Frontend (React / Next.js)**

- Library view: asset grid with before/after metadata panels
- Search interface: natural-language input with results list (asset reference, timestamp, relevance)
- Discovery view: viewer intent input and content rail output
- Programming view: channel brief input and lineup output
- Developer mode toggle: raw API request/response viewer

**Backend (Python FastAPI or Node.js)**

- Asset management: tracks upload status, maps asset IDs to display metadata
- Knowledge store manager: creates and manages the demo knowledge store; handles polling for item readiness
- Jockey API client: wraps `POST /responses` with domain-specific `instructions` and structured output schemas for each capability
- Session manager: maintains `session_id` across multi-turn interactions within a single demo session
- Schema library: pre-built JSON Schemas for each capability (metadata hydration, search, discovery, programming)

**Sample Asset Library**

- 15-20 pre-indexed video clips covering the target streaming use cases
- Mix of: FAST channel clips (reality, drama, lifestyle), micro-drama footage, long-form archive excerpts
- Intentionally varied metadata quality: some assets have rich metadata, others have title-only or empty records
- Hosted on publicly accessible CDN for URL-based ingestion

### Technology Stack

- **Frontend**: Next.js 14 (React), TypeScript, Tailwind CSS, Zustand, Axios
- **Backend**: Python 3.11, FastAPI, `requests` library with exponential backoff retry
- **Infra**: Single Docker container deployable on Fly.io, Railway, or AWS ECS; Cloudflare R2 or S3 for sample video files
- **TwelveLabs Agents**: Jockey `jockey1.0` via Assets + Knowledge Stores + Responses API (v1.3, private beta)

| Capability | Ingestion Config Focus |
| --- | --- |
| Metadata Hydration | Characters, moods, genre signals, scene types, audio events, topic tags, production quality |
| Search | All modalities (visual, audio, text on screen) — default extraction |
| Personalization | Audience signals, emotional tone, content length, format, viewer demographics |
| Smart Programming | Episode structure, thematic arcs, pacing, lead-in/out cues |

### Data Flow (Demo Mode)

1. Pre-indexed knowledge store with sample assets (eliminates live ingestion wait in demo)
2. User triggers a capability (search query, intent input, channel brief)
3. Backend constructs a `POST /responses` request with appropriate `instructions` + `text.format` schema
4. Jockey returns structured JSON response
5. Backend parses and formats for display
6. Frontend renders results alongside optional raw API view
7. Multi-turn follow-up queries pass `session_id` for context continuity

---

## 🪜Technology Stack

### Frontend

- **Framework:** Next.js 14 (React) with TypeScript
- **Styling:** Tailwind CSS with TwelveLabs brand tokens
- **State:** Zustand for session and demo state management
- **API Client:** Axios with request/response logging for Developer Mode

### Backend

- **Runtime:** Python 3.11 with FastAPI
- **Jockey Client:** `requests` library with exponential backoff retry wrapper
- **Session State:** In-memory (Redis optional for multi-user deployment)
- **Async Polling:** `concurrent.futures` for parallel item readiness checks

### Infrastructure

- **Demo Deployment:** Single Docker container (frontend + backend) deployable on Fly.io, Railway, or AWS ECS
- **Asset Hosting:** Cloudflare R2 or S3 for sample video files (public URL access required by Jockey)
- **Environment:** `.env` file for `TWELVELABS_API_KEY`; no other secrets required for MVP

### TwelveLabs APIs Used

- `POST /v1.3/assets` — asset upload via URL method
- `GET /v1.3/assets/{id}` — asset status polling
- `POST /v1.3/knowledge-stores` — knowledge store creation with domain-specific ingestion config
- `POST /v1.3/knowledge-stores/{id}/items` — asset indexing
- `GET /v1.3/knowledge-stores/{id}/items/{item_id}` — indexing status polling
- `POST /v1.3/responses` — all four capability queries (with `instructions`, `session_id`, `text.format`)

**Model:** `jockey1.0`

---

## 📝 API Specifications

### Core Jockey Request Pattern

All capability queries follow the same structure. The `instructions` field and `text.format` schema change per capability.

```json
POST https://api.twelvelabs.io/v1.3/responses
{
  "model": "jockey1.0",
  "knowledge_store_id": "<DEMO_STORE_ID>",
  "session_id": "<optional: for multi-turn>",
  "instructions": "<capability-specific system prompt>",
  "input": [
    {
      "type": "message",
      "role": "user",
      "content": "<user query or demo input>"
    }
  ],
  "text": {
    "format": {
      "type": "json_schema",
      "name": "<schema_name>",
      "schema": { ... }
    }
  }
}
```

### Metadata Hydration Schema

```json
{
  "type": "object",
  "properties": {
    "asset_reference": { "type": "string" },
    "title_suggested": { "type": "string" },
    "genre": { "type": "array", "items": { "type": "string" } },
    "mood": { "type": "array", "items": { "type": "string" } },
    "characters": { "type": "array", "items": { "type": "string" } },
    "scene_types": { "type": "array", "items": { "type": "string" } },
    "audio_events": { "type": "array", "items": { "type": "string" } },
    "topics": { "type": "array", "items": { "type": "string" } },
    "content_rating_signal": { "type": "string" },
    "summary": { "type": "string" }
  }
}
```

### Semantic Search Schema

```json
{
  "type": "object",
  "properties": {
    "query_interpretation": { "type": "string" },
    "total_results": { "type": "integer" },
    "results": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "asset_reference": { "type": "string" },
          "timestamp_start": { "type": "string" },
          "timestamp_end": { "type": "string" },
          "description": { "type": "string" },
          "match_type": { "type": "string", "description": "visual | audio | semantic | text_on_screen" },
          "relevance_score": { "type": "string" }
        }
      }
    }
  }
}
```

### Personalized Discovery Schema

```json
{
  "type": "object",
  "properties": {
    "viewer_intent_interpretation": { "type": "string" },
    "recommended_rail": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "rank": { "type": "integer" },
          "asset_reference": { "type": "string" },
          "title": { "type": "string" },
          "clip_start": { "type": "string" },
          "clip_end": { "type": "string" },
          "rationale": { "type": "string" },
          "match_signals": { "type": "array", "items": { "type": "string" } }
        }
      }
    }
  }
}
```

### Smart Programming / FAST Lineup Schema

```json
{
  "type": "object",
  "properties": {
    "channel_brief_interpretation": { "type": "string" },
    "lineup": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "position": { "type": "integer" },
          "asset_reference": { "type": "string" },
          "title": { "type": "string" },
          "clip_start": { "type": "string" },
          "clip_end": { "type": "string" },
          "duration_minutes": { "type": "number" },
          "programming_rationale": { "type": "string" },
          "lead_in_note": { "type": "string" }
        }
      }
    },
    "total_runtime_minutes": { "type": "number" },
    "programming_notes": { "type": "string" }
  }
}
```