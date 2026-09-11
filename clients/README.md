# gramintel-clients

HakiAPI-based clients for GramIntel backend.

- `GroqClient` — narrative generation via Groq `llama-3.1-8b-instant`, retries + fallback template
- `OverpassClient` — OSM POI fetch with primary→fallback (overpass-api.de → kumi.systems), 6s timeout
- `GramIntelAPI` — typed SDK for FastAPI (`/health`, `/auth/*`, `/assistant/analyze`, `/cases/*`, `/portal/*`)

Install: `pip install -e ./clients`
