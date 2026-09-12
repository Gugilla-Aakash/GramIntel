# GramIntel — Total Code Details

Status: working-tree documentation only. This file is intentionally not committed yet.

Generated from the current repository state on 2026-09-12. It describes what the code currently does, not what is only planned. For the project narrative and design decisions, also see [`README.md`](README.md), [`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md), and [`AGENTS.md`](AGENTS.md).

## 1. What GramIntel is

GramIntel is a hyper-local business advisory and financial structuring application for rural and semi-urban entrepreneurs. The product takes a location, available margin capital, and a business category, then produces:

1. A hyper-local feasibility report using market, competition, supply, demand, pricing, and risk signals.
2. A deterministic financial plan using the MoSJE/SCA margin-and-loan rules.
3. A multilingual narrative in English, Hindi, or Telugu.
4. An applicant-to-officer case workflow with review, chat, approval, rejection, and status history.

The repository is a monorepo:

```text
GramIntel/
├── frontend/       Next.js landing site and working applicant/officer UI
├── backend/        FastAPI + SQLModel API and deterministic business engine
├── clients/        Python HTTP clients for Groq, Overpass, and GramIntel
├── Presentation/   SIH presentation files
├── Makefile        local demo, seed, build, and test commands
└── total_details.md this document
```

## 2. End-to-end architecture

```text
Browser
  ├─ /                         cinematic landing page
  ├─ /assistant                applicant workspace
  ├─ /portal                   officer workspace
  └─ /map                      live/demonstration map explorer
       │
       ├─ /api/backend/*       Next.js REST proxy
       └─ /api/chat/:case_id   Next.js streaming chat proxy
              │
              ▼
        FastAPI backend :8000
              │
              ├─ SQLite through SQLModel
              ├─ deterministic finance and feasibility services
              ├─ Groq for narrative/chat, with templates when unavailable
              ├─ Overpass/OSM for nearby places, with seeded fallback
              └─ SMTP for OTP and decision email when configured
```

The frontend does not normally call FastAPI directly. The Next proxy forwards requests to `NEXT_PUBLIC_API_BASE`, `API_BASE`, or local `http://localhost:8000`.

The latest narrative language behavior is deliberately different from the original backend-only approach:

- `/assistant/analyze` creates the source narrative once.
- `/portal` and `/assistant` use [`frontend/src/lib/narrative-translator.ts`](frontend/src/lib/narrative-translator.ts) for Hindi/Telugu switching.
- Puter.js is loaded once from the CDN.
- The client caches translations by source narrative and language.
- If client translation fails, non-English views avoid displaying the English narrative instead of crashing.

## 3. Business rules implemented

### 3.1 Financial rules

The backend treats available margin capital as 10% of project cost:

```text
project_cost = margin_capital × 10
max_loan = min(project_cost × 90%, scheme loan cap)
```

| Scheme | Project cost | Interest | Tenure | Moratorium | Maximum loan |
|---|---:|---:|---:|---:|---:|
| Micro Finance | ≤ ₹1,40,000 | 6.5% p.a. | 36 months | 3 months | ₹1,25,000 |
| Term Loan | > ₹1,40,000 and ≤ ₹50,00,000 | 8% p.a. | 84 months | 6 months | ₹45,00,000 |

The monthly EMI uses the standard reducing-balance formula. Quarterly EMI is monthly EMI multiplied by three. The schedule includes principal, interest, EMI, remaining balance, and a moratorium flag.

### 3.2 Case status rules

```text
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED
                                  └→ REJECTED
```

Applicants submit draft cases. An officer decision automatically moves a submitted case through `UNDER_REVIEW` and then to the final decision. Decision history is persisted.

### 3.3 Data resilience rules

- Overpass requests use a primary and secondary endpoint, timeouts, and seeded fallback data.
- Groq narrative and chat requests use structured prompts and deterministic localized templates when no key or service is available.
- MapLibre tries multiple map styles/providers.
- Landing sections use `ErrorBoundary` and a shimmer fallback.
- Browser caches geocoding and nearby-place results in `localStorage`.

## 4. Root files and project configuration

### `README.md`

The operational project README. It explains the problem, stack, one-command demo, scheme constants, endpoint list, environment variables, deployment targets, and resilience promise.

### `PROJECT_OVERVIEW.md`

Evidence-based project overview. It is the high-level reference for product identity, user journeys, feature inventory, architecture, API behavior, database schema, limitations, security, performance, deployment, and discrepancies.

### `AGENTS.md`

Agent/developer guide. It records the monorepo topology, approved app design, landing section order, pinned versions, deterministic helpers, environment rules, build commands, and implementation gotchas.

### `Makefile`

Provides the main local commands:

- `make demo`: creates tables, runs the seed hook, starts FastAPI on port 8000, health-checks it, then starts the frontend.
- `make seed`: creates database tables and runs `backend.app.seed.seed`.
- `make backend`: starts FastAPI with reload.
- `make frontend`: starts Next.js development server.
- `make build`: runs the frontend production build.
- `make test`: runs backend pytest and the frontend build.

### `.gitignore`

Root ignore rules for local databases, environments, build output, dependency folders, secrets, and other generated artifacts.

### `opencode.json`

Root OpenCode configuration. It is the canonical repository-level configuration for the agent/plugin setup.

### `.opencode/package.json` and `.opencode/.gitignore`

Local OpenCode plugin metadata and ignore rules. They do not participate in the application runtime.

### `Presentation/SIH-Presentation.pptx`

Older SIH presentation artifact.

### `Presentation/SIH-Presentation-GramIntel.pptx`

GramIntel-specific SIH presentation artifact.

### `Presentation/SIH-Presentation-GramIntel.pdf`

PDF export of the GramIntel presentation.

## 5. Frontend configuration files

### `frontend/package.json`

Defines the Next.js 14 application and scripts:

- `dev`: Next development server.
- `build`: production compilation, lint/type validation, and route generation.
- `start`: production server.
- `demo`: development demo shell script.
- `demo:prod`: builds and starts backend plus production Next server.

Important dependencies include React 18, Next 14, Framer Motion, GSAP, Lenis, MapLibre 5.6.0, Three.js, React Three Fiber, React Markdown, Remark GFM, Tailwind 4, and Lucide.

### `frontend/package-lock.json`

Locks the npm dependency graph. It is generated by npm and should change only with intentional dependency changes.

### `frontend/next.config.mjs`

Next configuration. It defines remote image hosts, image formats, optimized package imports, and framework build behavior. MapLibre remains pinned at 5.6.0 because newer major versions can break the Next webpack setup.

### `frontend/tsconfig.json`

TypeScript compiler configuration. It enables strict TypeScript behavior, Next.js integration, JSX support, and the `@/*` source alias.

### `frontend/tailwind.config.ts`

Tailwind configuration. Tailwind exists alongside the primary inline-style/CSS-variable design system.

### `frontend/postcss.config.js`

PostCSS/Tailwind processing configuration used by the Next build.

### `frontend/components.json`

shadcn component metadata. The project uses local components and a local staggered-text fallback rather than relying on the blocked paid React Bits installation.

### `frontend/index.html`

Legacy/static HTML shell retained in the copied frontend project. The active Next App Router entry is under `frontend/src/app`.

### `frontend/.env.example`

Documents frontend environment variable names such as `NEXT_PUBLIC_MAPTILER_KEY`, `NEXT_PUBLIC_API_BASE`, and `REACTBITS_LICENSE_KEY`. Secret values are not stored here.

### `frontend/.gitignore`

Ignores frontend-specific build output, dependencies, local environment files, and generated artifacts.

### `frontend/scripts/demo.sh`

Shell helper for the local demo flow. It prepares the backend tables/seed and starts the services in the expected local configuration.

## 6. Frontend App Router files

### `frontend/src/app/layout.tsx`

Root layout. It imports Fraunces and Instrument Sans fonts, global CSS, metadata, viewport settings, map/data preconnects, and the Puter.js CDN script. The script uses Next `afterInteractive` loading so client-side narrative translation is available without blocking initial HTML.

Exports:

- `metadata`: page title, description, and keywords.
- `viewport`: theme color and responsive viewport settings.
- `RootLayout`: wraps every route in `<html>` and `<body>`.

### `frontend/src/app/page.tsx`

Root `/` page. Renders the landing `Site` component and preserves the main content entry point.

### `frontend/src/app/not-found.tsx`

Next not-found page. Displays the application’s branded not-found state.

### `frontend/src/app/icon.svg`

Browser/app icon asset.

### `frontend/src/app/globals.css`

Global design system and responsive styling. It defines the forest, cream, gold, ink, line, typography, layout-shell, button, map, markdown-chat, section, and multilingual styles. It also contains reduced-motion and mobile behavior used throughout the landing and app.

### `frontend/src/app/auth/callback/page.tsx`

Google OAuth callback page. `CallbackInner` reads `token`, `role`, `email`, and `error` from the URL, stores successful credentials in `localStorage`, then routes the user to `/assistant` or `/portal` based on role. `AuthCallbackPage` wraps it in Suspense for `useSearchParams`.

### `frontend/src/app/(app)/assistant/page.tsx`

Applicant workspace and analysis flow.

Main responsibilities:

- Applicant OTP and Google authentication.
- Restore applicant token and UI language from `localStorage`.
- Collect village, block, district, margin capital, business category, and language.
- Geocode the location when possible.
- Call `POST /api/backend/assistant/analyze`.
- Render feasibility, financial plan, repayment schedule, narrative, and data-source banners.
- Switch narrative language through `translateNarrative` instead of repeatedly calling backend narration.
- Submit the generated case with `POST /api/backend/cases`.
- Load the applicant’s cases and open `CaseChat` for an existing case.

Important local functions/state include `requestOtp`, `verifyOtp`, `persist`, `clearAuth`, `fetchMyCases`, `analyze`, `switchNarrative`, `apply`, and the component state for authentication, form inputs, result, narrative, submission, and chat.

### `frontend/src/app/(app)/portal/page.tsx`

Officer portal.

Main responsibilities:

- Officer OTP and Google authentication.
- Restore officer session from `localStorage`.
- Load and filter the officer case queue.
- Search by village, business category, or district.
- Load selected case details.
- Translate the source narrative on the client for Hindi/Telugu using `translateNarrative`.
- Render feasibility, financial data, narrative, status history, and decision controls.
- Require a decision note before approval/rejection.
- Call `POST /cases/{id}/decision`, refresh the detail, and reload the queue.
- Show `CaseChat` for the selected case.

Important functions include `persist`, `clear`, `requestOtp`, `verifyOtp`, `loadCases`, `openDetail`, and `decide`.

### `frontend/src/app/(app)/map/page.tsx`

Standalone map explorer route. It loads nearby places, searches locations, manages the selected place and radius, and composes `MapHeader`, `SearchBar`, `ExplorerMap`, `PlacePanel`, `IntelPanel`, `OpportunityMode`, and approved-case data.

### `frontend/src/app/api/backend/[...path]/route.ts`

Catch-all REST proxy. `proxy` constructs a backend URL from the dynamic path and query string, forwards relevant headers/body, preserves status and response headers, and returns a 502 JSON response when FastAPI is unavailable. It exports `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` handlers that all call `proxy`.

### `frontend/src/app/api/chat/[case_id]/route.ts`

Streaming case-chat proxy. Its `POST` handler forwards the authorization header and request body to FastAPI’s case chat endpoint, then passes the upstream response stream back to the browser. Errors are converted to a readable response.

### `frontend/src/app/api/explain/route.ts`

Edge runtime Groq explainer for the landing repayment section. `POST` reads `lang`, normalizes it to English/Hindi/Telugu, sends a short EMI prompt to Groq when `GROQ_API_KEY` exists, and returns localized static fallback text on missing key, request failure, or invalid response.

## 7. Landing composition and visual components

### `frontend/src/components/Site.tsx`

Canonical landing composition. `SectionFallback` renders the 60vh loading/error shimmer. `Site` mounts the global smooth-scroll wrapper, navigation, progress bar, cursor, and the story sections in this exact order:

```text
Hero
ProblemIntelligence
HowItThinks
RuralVideo
MapStory
MarketCloseup
ViabilityScore
AIReasoning
FinancialStory
SchemeRouter
RepaymentSim
Multilingual
FinalCTA
Footer
```

Most below-fold sections are lazy-loaded and wrapped in Suspense plus `ErrorBoundary`. `TheQuestion` is intentionally not mounted here because the hero veil already contains that quote.

### Hero files

#### `components/hero/Hero.tsx`

Above-the-fold hero. `Hero` renders the brand promise, localized heading/subtitle, CTA buttons, scroll cue, veil quote, and `EconomyVisual`. CTAs route to `/assistant` or the landing repayment anchor.

#### `components/hero/EconomyVisual.tsx`

Animated SVG/economic-signal visual. Helpers `polar`, `arcPath`, and `connPath` convert radial coordinates into SVG paths. `Layer` handles parallax transforms. `EconomyVisual` draws the village center, consumers, demand, suppliers, competition, transport, markets, opportunity radius, and the opportunity-detected badge.

#### `components/hero/HeroMapBackground.tsx`

Decorative hero map background. `HeroMapBackground` renders a lightweight non-interactive map-like visual behind the hero copy.

### Story sections

#### `components/problem/ProblemIntelligence.tsx`

Problem-to-signal section. `buildPoints` deterministically creates plotted data points. `ChaosDot` renders animated points. `ProblemIntelligence` visualizes noisy anecdotal business decisions becoming a clear decision signal.

#### `components/thinking/HowItThinks.tsx`

Five-stage explanation of the GramIntel reasoning process. `StageArt` draws each stage visual; `StagePanel` renders the stage copy and active state; `HowItThinks` controls scroll/visibility and the seen-stage set.

#### `components/rural-video/RuralVideo.tsx`

Rural context media section. `RuralVideo` composes the cinematic video/photo background, localized overlay copy, and resilience fallback.

#### `components/market-intelligence/MarketCloseup.tsx`

Market intelligence section. It renders the market image, localized market interpretation, demand/pricing cards, and evidence labels. `STATS` contains the presentation values used in the section.

#### `components/viability/ViabilityScore.tsx`

Viability score section. `Gauge` renders an individual circular score gauge. `ViabilityScore` presents the six weighted factors: demand, supply, pricing, competition, finance, and risk.

#### `components/intelligence-engine/AIReasoning.tsx`

Animated reasoning pipeline. `inputPath` and `outputPath` generate SVG connector paths. `AIReasoning` draws local inputs flowing through the intelligence engine into business/finance outputs and uses `TerrainScene` for the animated background.

#### `components/intelligence-engine/TerrainScene.tsx`

Three.js terrain visual. `TerrainMesh` creates a deformed grid, animated vertex motion, and points/lines. `TerrainScene` mounts the mesh in a React Three Fiber canvas when active.

#### `components/financial-story/FinancialStory.tsx`

Financial ladder story. `FinancialStory` scroll-animates the relationship between margin capital, project cost, and loan amount, including the canonical ₹1,00,000 → ₹10,00,000 → ₹9,00,000 example.

#### `components/scheme-router/SchemeRouter.tsx`

Interactive scheme decision tree. `SchemeRouter` shows the project-cost boundary and routes to Micro Finance or Term Loan, with rate, tenure, moratorium, and caps.

#### `components/repayment/RepaymentSim.tsx`

Repayment and multilingual explainer section. `polarPath` creates chart sector paths. `PolarAreaChart` renders the five-sector polar visual. `RepaymentSim` scroll-animates the ledger, displays monthly and quarterly EMI, invokes `/api/explain` for the landing explanation, and shows Hindi/Telugu controls.

#### `components/multilingual/Multilingual.tsx`

Language demonstration section. It reads the current UI language, displays the localized language name and GramIntel visual words, and animates the multilingual transition.

#### `components/final-cta/FinalCTA.tsx`

Final conversion section. `FinalCTA` presents the final proof points and links the visitor to the applicant assistant.

#### `components/footer/Footer.tsx`

Landing footer. `Footer` renders brand, navigation/status details, and the closing local-data note.

## 8. Frontend map explorer components

### `components/map/MapStory.tsx`

Scroll-pinned five-stage map narrative. `Chip` renders small localized map labels. `MapStory` mounts the map after hydration, tracks scroll progress, calculates the current stage, and keeps `pinSpacing` enabled for correct layout.

### `components/map/GramIntelMap.tsx`

Primary landing map. `cartoTiles` builds CARTO fallback tile URLs. `localizedCategoryLabel` maps place categories to UI strings. `vis` toggles MapLibre layer visibility. `GramIntelMap` handles map initialization, style fallback, markers, place fetching, scan animation, route/market/consumer/supplier layers, category filters, language updates, keyboard behavior, and teardown.

### `components/map-explorer/ExplorerMap.tsx`

Interactive `/map` MapLibre map. `cartoTiles` builds fallback tile URLs. `zoomForRadius` derives zoom from search radius. `prefersReducedMotion` detects motion preference. `placesToGeoJSON` converts places into a point FeatureCollection. `ExplorerMap` handles style cascade, place source updates, radius circle, center marker, feature selection, movement callbacks, and WebGL/style failure UI.

### `components/map-explorer/MapHeader.tsx`

Explorer page header. `MapHeader` renders branding, navigation, menu state, language control, and assistant/portal links.

### `components/map-explorer/SearchBar.tsx`

Location/business search control. `SearchBar` manages tabs, location query, geocoder results, business category filtering, keyboard navigation, open/close state, and selection callbacks.

### `components/map-explorer/PlacePanel.tsx`

Selected-place detail panel. `PlacePanel` filters/organizes places by category, shows the selected place, and provides map navigation controls.

### `components/map-explorer/PlaceCard.tsx`

Single-place card. `PlaceCard` shows name, localized category, distance, confidence/source, close behavior, and “view on map” action.

### `components/map-explorer/IntelPanel.tsx`

Map-derived intelligence summary. `IntelPanel` uses `dominantCategory`, `avgDistance`, `categoryBreakdown`, and `densityBand` to display count, density, dominant category, and average distance.

### `components/map-explorer/OpportunityMode.tsx`

Opportunity overlay. `OpportunityMode` compares the chosen business category with nearby places and renders demand/competition opportunity messaging.

## 9. Frontend portal, primitives, and system components

### Portal components

#### `components/portal/CaseChat.tsx`

Case advisor chat. `CaseChat` loads suggestions, sends chat messages through `/api/chat/{case_id}`, reads a streaming response, supports abort/reset, retains visible message history, and uses `Markdown` for rendering.

#### `components/portal/Markdown.tsx`

Markdown renderer for advisor messages. `repairCollapsedTables` repairs model output where table rows collapse onto one line. The exported `Markdown` component uses React Markdown, GFM, external-link handling, and the `.gi-md` style system.

#### `components/portal/Sidebar.tsx`

Officer case queue sidebar. `Sidebar` renders filtered cases, search state, selected case, status labels, responsive open/close behavior, and navigation links. `SidebarLink` renders individual navigation links.

### Primitive animation components

- `primitives/AnimatedNumber.tsx`: `AnimatedNumber` interpolates a numeric value for scroll/visibility-driven number animation.
- `primitives/AnimatedPath.tsx`: `AnimatedPath` animates SVG path drawing using path length.
- `primitives/MagneticButton.tsx`: `MagneticButton` applies pointer-relative transform and hover motion to a button/link.
- `primitives/Parallax.tsx`: `Parallax` maps scroll progress to vertical movement and optional scale.
- `primitives/ScrollReveal.tsx`: `ScrollReveal` reveals children when visible; `RevealRule` is a compact line reveal.
- `primitives/SectionLabel.tsx`: `SectionLabel` renders numbered eyebrow labels and optional content.
- `primitives/SplitText.tsx`: `SplitLines` and `SplitWords` split text into animated Framer Motion lines/words.

### System components

#### `components/system/Nav.tsx`

Global landing navigation. `Nav` renders the logo, seven section anchors, language picker, assistant CTA, officer link, mobile menu, scroll reveal behavior, and blended language control. `clampPx` calculates responsive menu sizing.

#### `components/system/SmoothScroll.tsx`

Lenis provider. `useLenis` exposes the current Lenis instance. `SmoothScroll` creates/destroys Lenis, runs its RAF loop, handles reduced motion/touch behavior, and pauses work when the tab is hidden. `scrollToId` computes the target position using the navigation height CSS variable.

#### `components/system/ProgressBar.tsx`

Scroll progress indicator. `ProgressBar` springs `scrollYProgress`, changes its color by phase, and labels the landing as Discovery, Intelligence, or Decision.

#### `components/system/Cursor.tsx`

Desktop custom cursor. `Cursor` listens for pointer movement and elements with `data-cursor`, then animates mode, label, position, and pressed state. It does not render the custom cursor on touch devices.

#### `components/system/ErrorFallback.tsx`

Landing resilience wrapper. `ErrorBoundary` catches render errors; `ErrorCopy` renders localized recovery copy. The section fallback keeps vertical space so a failed lazy section cannot collapse the scroll story.

### UI components

- `ui/button.tsx`: shadcn-style `Button` variant/size component using class-variance-authority and `cn`.
- `ui/staggered-text.tsx`: local `StaggeredText` fallback for animated text where the licensed React Bits component is unavailable.
- `icons/index.tsx`: shared Lucide-based icon map. `base` defines the common icon props and `Icon` exposes named icon components.

## 10. Frontend data, localization, and utility libraries

### `frontend/src/lib/demo-data.ts`

Single source for landing demonstration numbers. Defines `DataStatus`, `WithSource`, and `demoData`, including Gandipet coordinates, 12,480 consumers, demand, category signals, finance values, and status labels. `DemoData` is the inferred type.

### `frontend/src/lib/map-data.ts`

Deterministic map geometry and finance helper library.

- `kmToDegLat`, `kmToDegLng`: convert distances to degree offsets.
- `circlePolygon`: build a circular GeoJSON polygon.
- `blobPolygon`: build a seeded irregular opportunity region.
- `buildCompetitors`, `buildConsumers`, `buildSuppliers`: create deterministic demo map entities.
- `buildTransportRoutes`: create route LineStrings.
- `buildOpportunityRegion`: create the opportunity polygon.
- `calcEMI`: authoritative frontend EMI formula used by repayment visuals.

It also defines `LayerKind`, `MapEntity`, category colors, demo categories, and demo business names.

### `frontend/src/lib/demo-places.ts`

Seeded places for offline map behavior.

- `seedFrom`: creates a deterministic seed from coordinates.
- `buildDemoPlaces`: generates nearby demo places within a radius.
- `fundedToPlace`: converts an approved case feed item into a map place.
- `ApprovedFeedItem`: describes public approved-case data.

### `frontend/src/lib/places.ts`

OSM/Overpass data adapter.

- `kmDistance`: Haversine distance in kilometers.
- `categorize`: maps OSM tags to `PlaceCategory`.
- `buildOverpassQuery`: creates the radius query.
- `fetchWithRetry`: calls primary/secondary Overpass servers with timeout.
- `placesFromElements`: normalizes Overpass elements into `RealPlace` values.
- `fetchPlacesViaBackend`: fetches backend dataset/place data.
- `fetchPlacesNear`: browser Overpass fetch with memory and localStorage caching.
- `fetchRealPlaces`: loads the default Gandipet area.
- `getCategoryIcon`, `getCategoryLabel`, `getCategoryColor`: UI mappings.

It defines `RealPlace`, `PlaceCategory`, the default Gandipet center, cache keys, and the Overpass query.

### `frontend/src/lib/geocode.ts`

Nominatim geocoder adapter.

- `searchPlaces`: forward geocodes a text query, validates coordinates, and caches results for 24 hours.
- `reverseGeocode`: converts coordinates into a display name with a local cache.
- Private cache helpers read/write `localStorage` records with timestamps.

### `frontend/src/lib/explorer-stats.ts`

Pure map analytics.

- `densityBand`: classifies place density as Low, Moderate, or High.
- `dominantCategory`: finds the most common category.
- `avgDistance`: calculates mean distance or null.
- `categoryBreakdown`: returns sorted category counts.
- `opportunitySignal`: compares category supply, closest competitor, density, and radius.

### `frontend/src/lib/map/map-story.ts`

Map-story camera model. Defines `MapStoryLocation`, the five-stage `MAP_STORY`, and `NUM_STAGES`. `lerp` interpolates scalar values; `interpolateCamera` eases between camera states; `cameraForProgress` gives smooth stage interpolation; `cameraForProgressQuick` gives a faster/held-stage variant used by map interaction.

### `frontend/src/lib/map/map-story-strings.ts`

Localized copy for each map stage. `localizeMapStory` merges the requested language’s copy into a stage and falls back to English when a key is missing.

### `frontend/src/lib/assistant-strings.ts`

Applicant-page localization and dynamic result labels.

- `UiLang`: English/Hindi/Telugu union.
- `STRINGS`: static assistant UI dictionary.
- `t`: returns a localized string by key.
- `CATEGORIES`: localized business category labels.
- `DATA`: dynamic data labels and translations.
- `TEMPLATES`: translated result templates.
- `tdyn`: translates dynamic lines/categories using exact and regex templates.
- `isWarmBanner`: identifies demo/fallback banners.

### `frontend/src/lib/landing-strings.ts`

Landing-wide language state and string translations. It defines the landing dictionary and the `useUiLang`, `setUiLang`, and translation helpers used by navigation and landing sections.

### `frontend/src/lib/ui-strings.ts`

Shared app/portal dictionary. It exports `UI_STRINGS`, `uiText`, `categoryText`, and `statusText` for labels, authentication errors, workflow statuses, officer controls, narrative labels, and multilingual UI copy.

### `frontend/src/lib/narrative-translator.ts`

Puter.js client translation layer.

- `NarrativeLanguage`: `en | hi | te`.
- `responseText`: extracts text from Puter response formats.
- `parseJson`: removes optional code fences and validates object JSON.
- `translateNarrative`: returns English source unchanged; otherwise builds a strict translation prompt, calls `window.puter.ai.chat`, preserves the original structure/numbers, adds `_model`/`_source`, and caches the result. `inFlight` prevents duplicate concurrent calls for the same narrative/language.

The `Window` declaration describes the CDN-provided `window.puter` object for TypeScript.

### `frontend/src/lib/media.ts`

Central media registry. `MEDIA` and `PHOTOS` hold external Pexels/video/image URLs and metadata used by cinematic media components.

### `frontend/src/lib/hooks.ts`

Reusable browser hooks, including media-query helpers such as `useMediaQuery`, `useIsMobile`, and `useIsTouch` used by responsive animation/map components.

### `frontend/src/lib/utils.ts`

Shared utility functions, including class-name merging through `cn` and INR formatting through `formatINR`.

### `frontend/src/lib/__tests__/explorer-stats.test.ts`

Vitest/Jest-style unit coverage for density classification, dominant category, average distance, category breakdown, and opportunity calculations.

## 11. Backend configuration and persistence

### `backend/requirements.txt`

Runtime dependencies: FastAPI, Uvicorn, SQLModel, Pydantic/settings, JWT support, HTTPX, multipart handling, Authlib, and related auth/email libraries.

### `backend/.env.example`

Documents backend configuration names such as `DATABASE_URL`, `JWT_SECRET`, `GROQ_API_KEY`, `ADMIN_EMAILS`, SMTP settings, Google OAuth settings, and Overpass URLs.

### `backend/app/__init__.py`

Package marker for the backend application.

### `backend/app/__main__.py`

Python module entry point for running the backend package.

### `backend/app/config.py`

`Settings` uses Pydantic Settings to load database, JWT, Groq, Google, SMTP, Overpass, and environment/deployment values. `settings` is the shared configuration instance.

### `backend/app/db.py`

Database setup.

- `create_db_and_tables`: imports models and creates SQLModel metadata tables.
- `get_session`: FastAPI dependency yielding a SQLModel session.

The default database is local SQLite, overridable with `DATABASE_URL`.

### `backend/app/models.py`

SQLModel persistence models.

- `utcnow`: timezone-aware UTC timestamp helper.
- `UserRole`: applicant/officer role enum.
- `CaseStatus`: DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED.
- `SchemeType`: Micro Finance/Term Loan enum.
- `User`: email, role, Google/identity fields, timestamps.
- `Case`: applicant-owned business analysis and current status.
- `FeasibilityReport`: serialized feasibility result linked to a case.
- `FinancialPlan`: project cost, loan, scheme, EMI, and schedule values.
- `StatusHistory`: audit transition rows.
- `Narrative`: language-specific structured narrative rows.
- `OTPStore`: hashed/expiring OTP records and request metadata.

### `backend/app/schemas.py`

Pydantic request/response contracts.

- `OTPRequest`, `OTPVerify`: email and OTP payloads.
- `AnalyzeRequest`: village/block/district, margin, category, language, optional coordinates.
- `NarrateRequest`: target narrative language.
- `CreateCaseRequest`: analyzed case identifier.
- `DecisionRequest`: decision and note.
- `TokenResponse`: JWT/access token response.
- `HealthResponse`: health endpoint shape.

### `backend/app/deps.py`

FastAPI auth dependencies.

- `get_current_user`: reads Bearer JWT, verifies signature/expiry, loads the user.
- `require_role`: creates a dependency restricting a route to a role.
- `get_optional_user`: best-effort user lookup for guarded documentation routes.

## 12. Backend services

### `backend/app/services/financial.py`

Authoritative financial engine.

- `working_capital`: derives working-capital allowance from project cost.
- `calc_emi`: standard monthly amortization formula.
- `scheme_for_project_cost`: routes to Micro Finance, Term Loan, or ineligible based on boundaries and caps.
- `quarterly_schedule`: creates the quarter-by-quarter repayment schedule and moratorium flags.
- `compute_financial_plan`: validates margin/project limits and returns the complete financial plan.

### `backend/app/services/feasibility.py`

Hyper-local feasibility engine.

- `_haversine_km`: calculates distance between coordinates.
- `_clamp`: bounds a score.
- `category_signals`: computes the six market signals from OSM elements, category, location, and radius.
- `pricing_band`: returns category pricing and benchmark values.
- `compute_feasibility`: combines live/seeded places, demographics/benchmarks, signals, SWOT-style insights, competitor mapping, demand, and weighted viability score.

### `backend/app/services/dataset_service.py`

Static dataset access.

- `_load_json`: reads a backend data JSON file.
- `get_villages_dataset`: returns village demographic records.
- `get_commodities_dataset`: returns category benchmark records.
- `get_schemes_dataset`: returns scheme catalog records.
- `_haversine_km`: location distance helper.
- `_clean_str`: normalizes user search text.
- `lookup_village`: exact/fuzzy village-block-district lookup with confidence and source information.
- `lookup_commodity_benchmark`: case-insensitive category benchmark lookup.

### `backend/app/services/narrative.py`

Narrative service boundary.

- `get_groq_client`: creates/configures the shared `GroqClient`.
- `generate_narrative`: requests structured multilingual narrative from Groq and uses the client fallback when unavailable.

### `backend/app/services/workflow.py`

Case state machine.

- `can_transition`: validates allowed current-to-next status changes.
- `decision_to_status`: maps an APPROVED/REJECTED decision to a case status.

### `backend/app/services/email.py`

SMTP and decision-email rendering.

- `_should_send`: determines whether SMTP is configured.
- `_send_email`: sends text/HTML mail through SMTP with STARTTLS when configured; otherwise logs safely.
- `decision_bodies`: creates localized/text and HTML decision messages.
- `send_decision_email`: sends the applicant decision notification.

### `backend/app/services/workflow.py` and `backend/app/services/__init__.py`

The workflow file contains the transition logic above. The services `__init__.py` is a package marker.

### `backend/app/seed.py`

Seed entry point. `seed` is idempotent in intent and currently acts as a lightweight hook; table creation is handled separately by `create_db_and_tables`.

## 13. Backend routers and HTTP API

### `backend/app/main.py`

FastAPI application assembly.

- `lifespan`: creates tables at startup.
- `_is_prod`: detects production environment.
- `docs_guard`: requires officer access for production API docs while allowing local access.
- `openapi_json`, `swagger_docs`, `redoc_docs`: guarded documentation routes.
- `health`: liveness endpoint.
- `root`: API index/pointer endpoint.
- `global_exc_handler`: consistent JSON error handler.

It also configures CORS, includes all routers, and exposes `/health`, `/docs`, `/redoc`, and `/openapi.json`.

### `backend/app/routers/auth.py`

Authentication and identity router.

- `_admin_emails`: parses the officer allowlist.
- `resolve_role`: assigns officer only for allowlisted emails; otherwise applicant.
- `_generate_code`: creates a six-digit OTP.
- `_otp_email_bodies`: creates OTP email text/HTML.
- `_send_email_otp`: sends OTP through SMTP or console transport.
- `request_otp`: rate-limits requests, upserts user/OTP record, and returns a development hint when configured.
- `verify_otp`: validates expiry/attempts/code, then returns a JWT.
- `auth_me`: returns current identity.
- `logout`: stateless logout acknowledgement.
- `oauth_google_authorize`: creates state and redirects to Google OAuth.
- `GoogleIdTokenPayload`: validates Google credential payload.
- `oauth_google_id_token`: validates a Google ID token and creates the local JWT.
- `oauth_callback`: exchanges Google callback code and creates the local JWT redirect.

Endpoints:

| Method | Route | Purpose |
|---|---|---|
| POST | `/auth/otp/request` | Request applicant/officer OTP |
| POST | `/auth/otp/verify` | Verify OTP and receive JWT |
| GET | `/auth/me` | Return current user |
| POST | `/auth/logout` | Logout acknowledgement |
| GET | `/auth/oauth/google/authorize` | Start Google OAuth |
| POST | `/auth/oauth/google/id_token` | Verify Google ID token |
| GET | `/auth/oauth/callback` | Complete Google redirect flow |

### `backend/app/routers/assistant.py`

Applicant analysis router.

- `analyze`: authenticates the applicant, computes financial plan, loads live/seeded places, computes feasibility, creates the case/report/plan, generates the first narrative, and returns the complete analysis.
- `get_verified_villages`: returns known village dataset records.
- `get_commodity_benchmarks`: returns category benchmark data.
- `get_schemes_catalog`: returns scheme catalog data.

Endpoints: `POST /assistant/analyze`, `GET /assistant/datasets/villages`, `GET /assistant/datasets/benchmarks`, and `GET /assistant/datasets/schemes`.

### `backend/app/routers/cases.py`

Case read, submission, chat, narrative, and decision router.

- `ChatRequest`: validates a chat message/history payload.
- `ApprovedCaseOut`: response model for the public approved-case feed.
- `list_approved_cases`: returns approved public cases.
- `create_case`: applicant submits an analyzed draft case.
- `get_case`: returns a case and linked reports, plans, narratives, and history to an authorized owner/officer.
- `_build_case_summary`: creates the compact case data used by chat context.
- `chat_case`: authorizes the owner/officer and streams Groq/template chat output.
- `narrate_case`: legacy/server-side per-language narrative endpoint; it remains available for API compatibility, although the current frontend language switches use Puter client translation.
- `decide_case`: validates officer permission, decision note/status transition, history, and email notification.

Endpoints: `GET /cases/approved`, `POST /cases`, `GET /cases/{case_id}`, `POST /cases/{case_id}/chat`, `POST /cases/{case_id}/narrate`, and `POST /cases/{case_id}/decision`.

### `backend/app/routers/portal.py`

Officer queue router. `list_cases` requires officer role, supports status filtering, joins core case information, and returns newest cases first.

Endpoint: `GET /portal/cases?status=`.

### `backend/app/routers/applicant.py`

Applicant case router. `list_my_cases` returns the authenticated applicant’s cases.

Endpoint: `GET /applicant/me/cases`.

### `backend/app/routers/places.py`

Public nearby-place router. `places_nearby` validates coordinates/radius and returns Overpass-backed or seeded nearby places.

Endpoint: `GET /places/nearby`.

### `backend/app/routers/__init__.py`

Package marker for API routers.

## 14. Backend static data

### `backend/app/data/village_demographics.json`

Fourteen village/district records. Each record includes village code, location, population, households, worker distribution, literacy, cooperatives, services, haat/power/SHG information, crops/livestock, and data source.

### `backend/app/data/commodity_benchmarks.json`

Category benchmark dictionary for Dairy, Retail, Kirana, Poultry, Food Processing, Textiles, Services, and Animal Husbandry. Values support pricing, demand, and narrative/feasibility context.

### `backend/app/data/schemes_catalog.json`

Scheme catalog list containing scheme ID/name, ministry, implementing agency, cost/loan caps, percentage, interest, tenure, moratorium, target group, and description.

## 15. Python clients package

### `clients/pyproject.toml`

Build metadata for the `gramintel-clients` package. It declares Python 3.10+, HTTPX, and optional pytest/pytest-asyncio development dependencies.

### `clients/README.md`

Explains the client package’s HakiAPI-style design and usage.

### `clients/gramintel/__init__.py`

Package marker and public client exports.

### `clients/gramintel/base.py`

Shared HTTP transport.

- `APIError`: typed API failure with status/detail/context.
- `BaseAPIClient`: sync HTTP client with base URL, bearer token support, retry behavior for 429/5xx, timeout handling, and circuit-breaker style failure protection.

### `clients/gramintel/groq_client.py`

Groq language-model client.

- `GroqClient`: supports structured narrative generation and streaming chat.
- Its request path sends OpenAI-compatible chat-completions requests to Groq.
- It includes EN/HI/TE prompts and deterministic localized fallback templates.
- It preserves model/source metadata in generated/fallback narrative results.

### `clients/gramintel/overpass_client.py`

Overpass/OSM client.

- `OverpassClient`: executes nearby-place queries, retries primary/fallback endpoints, normalizes responses, and returns seeded data when the live service fails.

### `clients/gramintel/api_client.py`

GramIntel Python SDK.

- `GramIntelAPI`: typed convenience wrapper around auth, analysis, cases, portal, applicant, places, datasets, narrative, chat, and decision endpoints.
- It inherits shared retry/token behavior from `BaseAPIClient`.

## 16. Backend tests

### `backend/tests/test_financial.py`

Golden tests for margin-to-project cost, Micro Finance boundary at ₹1.40 lakh, Term Loan boundary, ineligible inputs, EMI determinism, caps, moratorium, quarterly schedule, and working capital.

### `backend/tests/test_feasibility.py`

Tests the six-signal report, consumer/shop ratios, competitor density, pricing shape, seeded fallback, viability weights, location variation, and competition score changes.

### `backend/tests/test_datasets.py`

Tests JSON loading, exact/fuzzy village lookup, benchmark lookup, scheme catalog, actual-data integration, and unknown-village fallback.

### `backend/tests/test_clients.py`

Tests Groq fallback, mock transport, retries, Overpass live/fallback behavior, streaming chat, language prompts, multilingual offline fallback, and GramIntel SDK requests.

### `backend/tests/test_api.py`

FastAPI integration tests. It overrides the database/session and Overpass dependency, then tests health, authentication, analysis, auth guards, case submission, officer decisions, public approved feed, nearby places, role restrictions, workflow errors, narrative, streaming chat, applicant case listing, and dataset endpoints.

### `backend/tests/__init__.py`

Test package marker.

## 17. Main request flows

### Applicant analysis

```text
Assistant form
  → optional Nominatim geocode
  → POST /api/backend/assistant/analyze
  → Next REST proxy
  → FastAPI auth check
  → compute_financial_plan
  → Overpass/seeded nearby places
  → compute_feasibility
  → persist Case + FeasibilityReport + FinancialPlan
  → generate_narrative once
  → return case_id and result
```

### Applicant submission

```text
POST /api/backend/cases {case_id}
  → ownership check
  → DRAFT must be current status
  → status becomes SUBMITTED
  → StatusHistory row created
```

### Officer review

```text
GET /api/backend/portal/cases
  → select case
  → GET /api/backend/cases/:id
  → optional streamed chat through /api/chat/:id
  → POST /api/backend/cases/:id/decision
  → UNDER_REVIEW then APPROVED/REJECTED
  → history + optional email
```

### Narrative language switching

```text
Initial analysis returns source narrative
  → user selects hi/te
  → translateNarrative(source, language)
  → Puter.js chat returns strict JSON
  → browser cache stores language result
  → subsequent switch uses cache
```

## 18. Environment variables and secrets

### Frontend

- `NEXT_PUBLIC_MAPTILER_KEY`: optional MapTiler map style key.
- `NEXT_PUBLIC_API_BASE`: FastAPI URL; local default is `http://localhost:8000`.
- `REACTBITS_LICENSE_KEY`: optional/proprietary component key; local fallback is used when unavailable.
- `GROQ_API_KEY`: runtime-only key for the Next edge explainer, not stored in `.env.local`.

### Backend

- `DATABASE_URL`: SQLModel database URL; defaults to SQLite.
- `JWT_SECRET`: signing secret for bearer JWTs.
- `ADMIN_EMAILS`: comma-separated officer allowlist.
- `GROQ_API_KEY`: backend narrative/chat key.
- `OVERPASS_PRIMARY`, `OVERPASS_FALLBACK`: OSM endpoint overrides.
- Google OAuth client/configuration values.
- SMTP host, port, username, password, sender, and frontend URL.

Never put secret values into this document or source control.

## 19. Local commands

```bash
# Install backend and clients
pip install --break-system-packages -r backend/requirements.txt
pip install --break-system-packages -e ./clients

# Install frontend
cd frontend && npm install

# Run demo
make demo

# Run backend tests
python3 -m pytest backend/tests -v

# Frontend checks
cd frontend
node_modules/.bin/tsc --noEmit
NEXT_PRIVATE_BUILD_WORKER=0 npm run build
npm start
```

The frontend production build currently compiles `/`, `/assistant`, `/portal`, `/map`, OAuth callback, API proxy routes, chat proxy, and the edge explainer route.

## 20. Deployment model

- Frontend deploy target: Vercel, with `NEXT_PUBLIC_API_BASE` pointing at Render.
- Backend deploy target: Render, running Uvicorn on `0.0.0.0:10000`.
- SQLite is intentionally used for the demo; persistent Render storage is needed if data must survive restarts.
- Groq and Overpass are optional external services; the app is designed to remain usable with seeded/template fallback.

## 21. Important implementation constraints

1. Keep MapLibre at 5.6.0.
2. Keep the landing section order in `Site.tsx` unchanged.
3. Keep `pinSpacing: true` for pinned GSAP stories.
4. Do not re-add `TheQuestion` to `Site.tsx`; the hero already contains the veil quote.
5. Do not log environment values or API keys.
6. Keep money values formatted with INR conventions.
7. Keep external requests bounded by timeouts and preserve seeded/template fallbacks.
8. Do not treat the public demo numbers as live measurements; the UI labels their source/confidence.
9. The current Puter translation layer supports English, Hindi, and Telugu only.
10. The backend `/cases/{id}/narrate` endpoint remains for compatibility, but current frontend language switches should stay client-side.

## 22. Current verification status

At document creation time, the repository’s known checks are:

- Frontend TypeScript check: passed.
- Frontend production build: passed.
- Backend client regression tests: passed.
- Full backend test suite is available under `backend/tests` and should be run before release.

This file itself is intentionally uncommitted so it can be reviewed and corrected before being added to Git.
