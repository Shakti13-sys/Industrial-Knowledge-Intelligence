# IKIP — Industrial Knowledge Intelligence Platform

**ET AI Hackathon 2026 · Problem Statement #8: AI for Industrial Knowledge Intelligence**

IKIP is an evidence-grounded AI assistant for industrial plants. It ingests
equipment manuals, maintenance logs, and incident reports; extracts and
cross-references entities across them; and answers operational questions
with a visible reasoning trace, cited sources, and an honest confidence
score instead of a single black-box answer.

> "IKIP doesn't just search your documents — it reasons across them,
> remembers what your organization has already learned, and tells you
> honestly when it isn't sure."

This repository is a rebuild of the original hackathon prototype, hardened
into a portfolio-quality, enterprise-styled application while remaining
faithful to the PRD's explicitly simplified architecture (in-memory storage,
keyword-based retrieval, no OCR/multi-user auth) — see [What Changed](#what-changed-from-the-prototype)
below for the full diff and rationale.

---

## Screens

- **Dashboard** — real-time overview: document/entity/chunk counts, API health, recent documents, and a session activity feed.
- **Documents** — upload documents (real drag-and-drop with live progress), watch entity extraction happen, see the Proactive Recall Engine fire when a new document shares an equipment tag with one already on file, and manage the document library.
- **AI Chat** — ask cross-document questions and get an answer with an expandable "How I found this" reasoning trace, a confidence badge, and cited source excerpts.
- **Entity Intelligence** — every entity extracted across your documents with genuinely computed cross-document relationships (co-occurrence, mention counts, first/last seen) — no fabricated risk scores or confidence-per-entity.
- **Knowledge Overview** — real aggregate charts (document status breakdown, entities per document, most cross-referenced entities) computed from the actual corpus.
- **Settings** — read-only view of the real backend configuration (model, retrieval settings), plus a working theme toggle.
- **Help & About** — how the system actually works, honestly, plus a live health check.

## Architecture

```
Document Upload (PDF/TXT)
        │
        ▼
Text Extraction ──► LLM Entity Extraction ──► In-memory Store (+ JSON snapshot)
        │                                            │
        │                                   cross-document match?
        │                                            │ yes
        │                                            ▼
        │                                   Proactive Alert
        ▼
   Chunking (TF-IDF indexed)
        ▲
        │
User Question ──► TF-IDF Retrieval (top-k chunks) ──► LLM Answer Generation
                                                              │
                                                              ▼
                                        { answer, confidence, confidence_note,
                                          reasoning_trace, sources }
                                                              │
                                                              ▼
                                                     React (Vite) Frontend
```

**Backend:** FastAPI (async), Groq (Llama 3.3 70B, OpenAI-compatible API),
in-memory store with JSON persistence, dependency-free TF-IDF retrieval, and
a real `/api/entities` endpoint that computes cross-document entity
relationships (co-occurrence, mention counts, first/last seen) directly from
stored data — no fabricated risk scores or classifications.

**Frontend:** Vite + React 18 + TypeScript + React Router + Tailwind CSS,
with a graphite/copper enterprise theme. Every number shown in the UI is
either pulled live from the backend or derived from the real, in-session
event log (uploads, queries, alerts) — nothing is hardcoded demo data.

Both the storage layer (`app/storage.py`) and retrieval layer
(`app/retrieval.py`) are written behind small interfaces specifically so the
production path the PRD describes — dict → Postgres/Neo4j, TF-IDF → a real
vector index — is a new class, not a rewrite.

---

## Getting started

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add your GROQ_API_KEY
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # points at http://localhost:8000 by default
npm run dev
```

App: http://localhost:5173 (Vite's default dev port) — sign in with
`demo` / `ikip-demo` (see `backend/.env` to change these).

### Docker (both services)

```bash
GROQ_API_KEY=your_key docker compose up --build
```
The frontend is served via nginx on http://localhost:3000; the backend API
on http://localhost:8000.
Note: Vite bakes `VITE_API_BASE_URL` into the JS bundle at *build* time, not
runtime — if you change the backend URL, rebuild the frontend image
(`docker compose build frontend`) rather than just restarting the container.

---

## What changed from the prototype

The first working version proved the concept end-to-end but had real gaps
against both the PRD and basic production hygiene. Highlights:

| Area | Before | After |
|---|---|---|
| **Auth** | None — every endpoint public | JWT-protected routes behind a demo login |
| **CORS** | `allow_origins=["*"]` + credentials (invalid combo, rejected by browsers) | Explicit configured origins |
| **File handling** | User filename joined directly into path (path-traversal risk) | Sanitized, collision-safe filenames; extension + size validation |
| **LLM calls** | Synchronous call inside `async def`, blocking the event loop | Native async client (`AsyncOpenAI`), non-blocking |
| **Config** | `GROQ_API_KEY` read in code, `GROK_API_KEY` in `.env.example` — silently broken | Fixed, centralized in `pydantic-settings` |
| **Retrieval** | Whole-document keyword-overlap count | Per-chunk TF-IDF cosine similarity, ranks correctly, swappable interface |
| **JSON contract** | `reasoning_steps`, flat string sources, no `confidence_note` | Matches PRD contract exactly: `reasoning_trace`, `{doc_name, excerpt}` sources, `confidence_note` |
| **Persistence** | Pure in-memory; a restart silently erased every uploaded document | Same in-memory model, snapshotted to disk so a demo survives a restart |
| **Document management** | No list/delete endpoints; frontend had no document library | Full CRUD-lite: list, delete, live status |
| **Errors** | Bare `except: return []`; native `alert()` popups on the frontend | Structured HTTP errors + typed toast notifications |
| **UI** | Single flat page, one screen | Multiple focused screens (Dashboard, Documents, Chat, Entities, Knowledge, Settings, Help) behind a shared shell, loading skeletons, empty states |
| **Dependencies** | `langchain` + `faiss-cpu` in requirements, unused by the actual code | Removed; direct OpenAI-compatible client, dependency-free retrieval |
| **Ingestion flow** | Manual "Ingest Documents" button rebuilt the *entire* corpus from disk on every click | Upload chunks and indexes immediately; a `/reindex` endpoint remains for bulk recovery only |
| **Tests** | None | Smoke tests for ingestion, retrieval ranking, and cross-document entity detection |

## Second pass: a richer frontend, still honest

A later design pass replaced the frontend with a more ambitious Vite + React
UI (7 screens instead of 2, a graphite/copper enterprise theme, an entity
intelligence view). That version looked great but ran entirely on **mock
data** — fabricated multi-plant stats, a chat page that returned the same
canned answer regardless of the question, fake risk scores per entity, and
several buttons (delete, logout, preview) that didn't do anything. Wiring it
to the real backend meant either building the backend feature it implied, or
removing the fabrication. The rule applied throughout: **show it only if it's
real.**

| Area | Mock version | Wired to real backend |
|---|---|---|
| **Chat** | Same hardcoded answer for every question | Real `/api/query` call; answer, confidence, reasoning trace, and sources all come from the actual response |
| **Entities page** | Fabricated "risk level", per-entity "confidence", and a fake relationship graph | New `GET /api/entities` endpoint computing real mention counts, first/last seen, and genuine co-occurrence relationships |
| **Document upload** | Simulated progress bar (`setInterval`), no network call | Real upload via `XMLHttpRequest` with true `upload.onprogress` tracking |
| **Delete / logout buttons** | Rendered but non-functional | Wired to real `DELETE /api/documents/{id}` and real session clear + redirect |
| **Notifications / activity feed** | Static hardcoded array | Real in-session event log (`activity-context.tsx`) populated by actual logins, uploads, alerts, and queries — honestly labeled "This session," not a persistent history |
| **Dashboard stats** | "1,284 documents across 6 plants" | Real counts from `/api/documents` and `/api/entities`; multi-plant concept removed entirely (never existed in the backend) |
| **Knowledge page** | Fabricated ingestion trend, plant coverage %, and an "incidents" list | Simplified to real, computable aggregates only: document status breakdown, entities-per-document, most cross-referenced entities |
| **Settings page** | Fake 2FA/session-timeout/IP-allowlist toggles, editable "AI model" fields that don't do anything | Reduced to what's real: read-only backend config display, working theme toggle, sign-out |
| **Support page** | Fake support team, SLA numbers, forum member counts | Repurposed into an honest FAQ about actual system behavior + a live `/api/health` status check |
| **Auth guard** | None — every route was reachable regardless of login state | Real route protection; unauthenticated users are redirected to `/login` |

## Design notes

The UI is deliberately not another generic dark SaaS dashboard: a graphite
base with a copper/brass instrument accent (evoking gauge dials and hazard
markings rather than a generic blue), monospace type for anything that reads
like plant data (equipment tags, timestamps, confidence scores), and a
signature "entity bridge" visual in the Proactive Alert banner that shows
the actual cross-document link an engineer would want to see. The Entity
Intelligence page extends that idea into a genuine co-occurrence view —
which entities appear together in the same documents — rather than a
decorative graph.

## Honest limitations (kept from the original PRD, still true)

- Retrieval is TF-IDF, not a vector database — appropriate at the current
  corpus size (a handful to a few dozen documents) and explicitly swappable.
- No OCR: scanned/image PDFs are not supported, only typed text.
- Single demo account — no multi-tenant auth or per-user document isolation.
- The "session activity feed" and "session history" in Chat are exactly
  that — in-memory for the current browser session, not a persistent,
  cross-session audit log.

## Repository layout

```
IKIP/
├── backend/
│   ├── app/
│   │   ├── main.py          # app factory, middleware, error handlers
│   │   ├── config.py        # environment-driven settings
│   │   ├── security.py      # JWT auth
│   │   ├── schemas.py       # API contract (Pydantic)
│   │   ├── storage.py       # in-memory store + JSON snapshot
│   │   ├── retrieval.py     # TF-IDF retriever behind an interface
│   │   ├── ingestion.py     # safe upload handling, chunking
│   │   ├── llm.py           # async Groq client, entity/answer generation
│   │   └── routers/         # auth, documents, entities, query, health
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/           # dashboard, documents, chat, entities, knowledge, settings, support, login
│   │   ├── components/
│   │   │   ├── layout/      # app-shell, header, sidebar
│   │   │   ├── shared/      # page-header, stat-card, badges, command-palette, ...
│   │   │   └── ui/          # button, input, card, table
│   │   ├── lib/             # api client, types, auth/activity/data contexts
│   │   └── hooks/           # use-theme
│   └── package.json
├── sample-data/             # 4 cross-referenced sample documents for demos
└── docker-compose.yml
```
