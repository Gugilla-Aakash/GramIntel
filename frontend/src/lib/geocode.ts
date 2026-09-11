export interface GeoResult {
  name: string;
  lat: number;
  lng: number;
  type: string;
}

const SEARCH_BASE =
  "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=in&q=";
const CACHE_PREFIX = "gi-geocode:";
const CACHE_TTL_MS = 86400000; // 24h localStorage cache

function readPlacesCache(key: string): GeoResult[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: GeoResult[]; ts: number };
    if (!parsed || !Array.isArray(parsed.data) || typeof parsed.ts !== "number") return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writePlacesCache(key: string, data: GeoResult[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    return;
  }
}

export async function searchPlaces(
  query: string,
  options?: { signal?: AbortSignal }
): Promise<GeoResult[]> {
  try {
    const q = query?.trim();
    if (!q) return [];
    const key = `${CACHE_PREFIX}${q.toLowerCase()}`;
    const cached = readPlacesCache(key);
    if (cached) return cached;
    const res = await fetch(`${SEARCH_BASE}${encodeURIComponent(q)}`, {
      signal: options?.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const json: unknown = await res.json();
    if (!Array.isArray(json)) return [];
    const out: GeoResult[] = [];
    for (const item of json as Array<Record<string, unknown>>) {
      const lat = Number(item?.lat);
      const lng = Number(item?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      out.push({
        name: String(item?.display_name ?? q),
        lat,
        lng,
        type: String(item?.type ?? item?.class ?? ""),
      });
    }
    writePlacesCache(key, out);
    return out;
  } catch {
    return [];
  }
}

function readReverseCache(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: string; ts: number };
    if (!parsed || typeof parsed.data !== "string" || typeof parsed.ts !== "number") return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const key = `${CACHE_PREFIX}rev:${lat.toFixed(4)},${lng.toFixed(4)}`;
    const cached = readReverseCache(key);
    if (cached) return cached;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as Record<string, unknown>;
    const name = json?.display_name;
    if (typeof name !== "string" || name.length === 0) return null;
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify({ data: name, ts: Date.now() }));
      }
    } catch {
      return name;
    }
    return name;
  } catch {
    return null;
  }
}
