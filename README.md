# GramIntel — Hyper-Local Business Advisory & Financial Structuring

> MoSJE SIH 2026 — AI-Driven Hyper-Local Business Advisory and Financial Structuring Assistant

Beneficiaries bring 10% margin, SCAs fund 90% as concessional loan. GramIntel turns anecdote into a defensible business decision: hyper-local feasibility (6 PS signals) + deterministic financial plan + multilingual narrative — then a two-role approval loop.

- **Landing:** cinematic 6-min scroll (Next 14, forest/cream/gold, Fraunces + Instrument Sans, Lenis + GSAP). All CTAs → **/assistant**, officer entry → **/portal**.
- **App:** applicant workspace → officer portal, JWT OTP, OSM live with seeded fallback, Groq `openai/gpt-oss-20b` (streaming AI case advisor) with template fallback, quarterly EMI + moratorium.

## Stack

- **frontend/** — Next 14.2 at root, Tailwind v4 (inline-style primary), framer-motion/gsap/lenis, maplibre 5.6.0 pinned, three, shadcn local fallback. Deploys to **Vercel**.
- **backend/** — FastAPI lean SQLite via **SQLModel** (`Base.metadata.create_all()` + idempotent `seed.py`, no Alembic). Deploys to **Render** (single image, `uvicorn`).
- **clients/** — `gramintel` Python package (HakiAPI-style `BaseAPIClient` with retries on 429/5xx + circuit breaker) exposing `GroqClient`, `OverpassClient`, `GramIntelAPI` SDK.

## One-Command Demo (offline-capable except Groq/OSM which degrade)

```bash
# 1) install
pip install --break-system-packages -r backend/requirements.txt
pip install --break-system-packages -e ./clients
cd frontend && npm install

# 2) demo — seeds, starts backend :8000 & frontend :3000
make demo
# or
npm --prefix frontend run demo
# or manual:
python3 -c "from backend.app.db import create_db_and_tables; create_db_and_tables()"
python3 -c "from backend.app.seed import seed; seed()"
uvicorn backend.app.main:app --port 8000 &
NEXT_PUBLIC_API_BASE=http://localhost:8000 npm --prefix frontend run dev
```

Seed prepares village **Gandipet (17.3835,78.3222)** + scheme constants (no dummy users — officer access is allowlist-driven via `ADMIN_EMAILS`):

- **MICRO** ≤₹1.40L · 6.5% · 36mo · 3mo moratorium · cap ₹1.25L
- **TERM** >₹1.40L ≤₹50L · 8% · 84mo · 6mo moratorium · cap ₹45L

OTP is console-transport; `/auth/otp/request` returns `demo_code` in dev — copy it to verify.

Flow: `POST /auth/otp/request` → `POST /auth/otp/verify` → `POST /assistant/analyze` (feasibility + financial) → `POST /cases` (DRAFT→SUBMITTED) → `GET /portal/cases` (officer) → `POST /cases/{id}/decision` (APPROVED|REJECTED, enforced `DRAFT→SUBMITTED→UNDER_REVIEW→APPROVED|REJECTED` + `status_history`).

## Verification

```bash
python3 -m pytest backend/tests -v          # 32 tests: financial golden, feasibility six-signals, API happy paths, HakiAPI mock transport
cd frontend && npm run build 2>&1 | tail -20 # Route / 108kB, /assistant ~6.8kB, /portal ~4.4kB
```

## Env

`frontend/.env.local` (never commit, see `.env.example`):

```
NEXT_PUBLIC_MAPTILER_KEY=<key>
NEXT_PUBLIC_API_BASE=http://localhost:8000   # local demo; on Vercel set to https://<render>.onrender.com
REACTBITS_LICENSE_KEY=<key>                  # placeholder — local StaggeredText fallback lives at src/components/ui/staggered-text.tsx
# GROQ_API_KEY is NOT in file — set at runtime (process.env.GROQ_API_KEY) for /api/explain & backend GroqClient; fallback template renders when absent.
```

`backend` reads `DATABASE_URL` (default `sqlite:///./gramintel.db`), `JWT_SECRET`, `GROQ_API_KEY`, `OVERPASS_PRIMARY/FALLBACK`.

## Deployment

- **Vercel (frontend):** set `NEXT_PUBLIC_API_BASE=https://<your-backend>.onrender.com`, build = `npm run build`, output = `frontend`.
- **Render (backend):** Python runtime, build `pip install -r backend/requirements.txt && pip install -e ./clients`, start `uvicorn backend.app.main:app --host 0.0.0.0 --port 10000`, env `JWT_SECRET` + `GROQ_API_KEY` + optional `DATABASE_URL` (persistent disk for SQLite).

## Endpoints (jury artifact: /docs)

`POST /auth/otp/request`, `POST /auth/otp/verify` → JWT · `POST /assistant/analyze` → `case_id` · `POST /cases/{id}/narrate` · `POST /cases` · `GET /cases/{id}` · `GET /applicant/me/cases` · `GET /portal/cases?status=` · `POST /cases/{id}/decision` · `GET /health` · `GET /docs`.

## Resilience

Overpass 6s ×2 (primary→fallback) then seeded banner. Groq timeout/fallback to rule-template in EN/हि/ते — never blank. `ErrorBoundary` + shimmer per section, `60vh` fallback on landing. `/api/backend/[...path]` proxy surfaces 502 if backend unreachable; UI shows toast/banner.

*Landing `frontend/src/components/Site.tsx` order is canonical — do not reorder. MapLibre pinned to 5.6.0 (6.x breaks webpack). See `AGENTS.md` & specs in `frontend/docs/superpowers/specs/`.*
