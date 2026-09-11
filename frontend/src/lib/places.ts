/**
 * GRAMINTEL — REAL PLACE DATA FETCHER
 * ------------------------------------
 * Fetches real POIs near Gandipet, Hyderabad from the Overpass API (OpenStreetMap).
 * All data is real geographic data — never fabricated.
 */

export interface RealPlace {
  id: number;
  name: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
  distanceKm: number;
  source: "osm" | "gramintel" | "demo";
  amenity?: string;
  shop?: string;
  tourism?: string;
  historic?: string;
  leisure?: string;
}

export type PlaceCategory =
  | "all"
  | "market"
  | "food"
  | "retail"
  | "healthcare"
  | "education"
  | "finance"
  | "transport"
  | "business"
  | "landmark";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const SECONDARY = "https://overpass.kumi.systems/api/interpreter";

const CENTER = { lat: 17.3835, lng: 78.3222 } as const;
const RADIUS_METERS = 8000;

export function kmDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function categorize(
  amenity: string | undefined,
  shop: string | undefined,
  name: string,
  tourism?: string,
  historic?: string,
  leisure?: string
): PlaceCategory {
  const a = (amenity || "").toLowerCase();
  const s = (shop || "").toLowerCase();
  const n = name.toLowerCase();
  const t = (tourism || "").toLowerCase();
  const h = (historic || "").toLowerCase();
  const l = (leisure || "").toLowerCase();

  if (t || h || l === "park" || a === "place_of_worship" || n.includes("temple") || n.includes("mosque") || n.includes("church") || n.includes("fort") || n.includes("palace") || n.includes("lake") || n.includes("resort"))
    return "landmark";
  if (a === "marketplace" || a === "supermarket" || s === "supermarket" || s === "grocery" || s === "general" || n.includes("market") || n.includes("bazaar"))
    return "market";
  if (a === "restaurant" || a === "cafe" || a === "fast_food" || a === "food_court" || s === "food" || s === "bakery" || s === "butcher" || s === "dairy")
    return "food";
  if (a === "hospital" || a === "clinic" || a === "pharmacy" || a === "doctors" || a === "dentist" || s === "chemist" || s === "medical_supply")
    return "healthcare";
  if (a === "school" || a === "college" || a === "university" || a === "kindergarten" || a === "library")
    return "education";
  if (a === "bank" || a === "atm" || a === "bureau_de_change" || a === "post_office")
    return "finance";
  if (a === "bus_station" || a === "fuel" || a === "parking" || a === "bicycle_rental" || a === "taxi")
    return "transport";
  if (s && s !== "yes" && s !== "no")
    return "retail";
  return "business";
}

const OVERPASS_QUERY = `
[out:json][timeout:12];
(
  node["name"](around:${RADIUS_METERS},${CENTER.lat},${CENTER.lng});
  way["name"](around:${RADIUS_METERS},${CENTER.lat},${CENTER.lng});
  node["shop"](around:${RADIUS_METERS},${CENTER.lat},${CENTER.lng});
  node["tourism"]["name"](around:${RADIUS_METERS},${CENTER.lat},${CENTER.lng});
  node["historic"]["name"](around:${RADIUS_METERS},${CENTER.lat},${CENTER.lng});
  node["leisure"]["name"](around:${RADIUS_METERS},${CENTER.lat},${CENTER.lng});
  node["amenity"="place_of_worship"]["name"](around:${RADIUS_METERS},${CENTER.lat},${CENTER.lng});
);
out center body;
`;

function buildOverpassQuery(lat: number, lng: number, radius: number): string {
  return `
[out:json][timeout:12];
(
  node["name"](around:${radius},${lat},${lng});
  node["shop"](around:${radius},${lat},${lng});
  node["tourism"]["name"](around:${radius},${lat},${lng});
  node["historic"]["name"](around:${radius},${lat},${lng});
  node["leisure"]["name"](around:${radius},${lat},${lng});
  node["amenity"="place_of_worship"]["name"](around:${radius},${lat},${lng});
);
out body;
`;
}

async function fetchWithRetry(url: string, body: string | URLSearchParams, timeoutMs = 6000): Promise<Response> {
  const candidates = url === SECONDARY ? [SECONDARY] : [url, SECONDARY];
  let lastErr: unknown = null;
  for (const u of candidates) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(u, {
        method: "POST",
        body: body as any,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`Overpass ${res.status}`);
      return res;
    } catch (e) {
      lastErr = e;
      continue;
    }
  }
  throw lastErr ?? new Error("Overpass failed");
}

export function placesFromElements(
  elements: any[],
  lat: number,
  lng: number,
  radiusMeters: number
): RealPlace[] {
  const places: RealPlace[] = [];
  for (const el of elements || []) {
    const plat = el.lat || el.center?.lat;
    const plng = el.lon || el.center?.lon;
    const name = el.tags?.name;
    if (!plat || !plng || !name) continue;
    const dist = kmDistance(lat, lng, plat, plng);
    if (dist > radiusMeters / 1000) continue;
    places.push({
      id: el.id,
      name,
      category: categorize(el.tags?.amenity, el.tags?.shop, name, el.tags?.tourism, el.tags?.historic, el.tags?.leisure),
      lat: plat,
      lng: plng,
      distanceKm: Math.round(dist * 10) / 10,
      source: "osm",
      amenity: el.tags?.amenity,
      shop: el.tags?.shop,
      tourism: el.tags?.tourism,
      historic: el.tags?.historic,
      leisure: el.tags?.leisure,
    });
  }
  places.sort((a, b) => a.distanceKm - b.distanceKm);
  return places;
}

function cacheKey(lat: number, lng: number, radiusMeters: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)},${radiusMeters}`;
}

function storageKey(lat: number, lng: number, radiusMeters: number): string {
  return `gi-places:${lat.toFixed(3)}:${lng.toFixed(3)}:${radiusMeters}`;
}

function readStoredPlaces(key: string): RealPlace[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: RealPlace[]; ts: number };
    if (parsed && Array.isArray(parsed.data) && typeof parsed.ts === "number" && Date.now() - parsed.ts < 3600000) {
      return parsed.data;
    }
  } catch {}
  return null;
}

function writeStoredPlaces(key: string, places: RealPlace[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify({ data: places, ts: Date.now() }));
  } catch {}
}

export async function fetchPlacesViaBackend(
  lat: number,
  lng: number,
  radiusMeters: number = RADIUS_METERS
): Promise<RealPlace[]> {
  const key = cacheKey(lat, lng, radiusMeters);
  const stored = readStoredPlaces(storageKey(lat, lng, radiusMeters));
  if (stored) {
    cacheByKey.set(key, stored);
    return stored;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 70000);
    const res = await fetch(
      `/api/backend/places/nearby?lat=${lat}&lng=${lng}&radius_m=${radiusMeters}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (!res.ok) return [];
    const data = await res.json();
    const places = placesFromElements(data.elements || [], lat, lng, radiusMeters);
    cacheByKey.set(key, places);
    writeStoredPlaces(storageKey(lat, lng, radiusMeters), places);
    return places;
  } catch {
    return [];
  }
}

const cacheByKey = new Map<string, RealPlace[]>();
const pendingByKey = new Map<string, Promise<RealPlace[]>>();
let realCache: RealPlace[] | null = null;
let realPromise: Promise<RealPlace[]> | null = null;

export async function fetchPlacesNear(lat: number, lng: number, radiusMeters: number = RADIUS_METERS): Promise<RealPlace[]> {
  const key = cacheKey(lat, lng, radiusMeters);
  const skey = storageKey(lat, lng, radiusMeters);
  // localStorage cache: return fresh (<1h) immediately if available
  const stored = readStoredPlaces(skey);
  if (stored) {
    cacheByKey.set(key, stored);
    return stored;
  }
  if (cacheByKey.has(key)) return cacheByKey.get(key)!;
  if (pendingByKey.has(key)) return pendingByKey.get(key)!;

  const promise = (async () => {
    try {
      const query = buildOverpassQuery(lat, lng, radiusMeters);
      const body = new URLSearchParams({ data: query });
      const res = await fetchWithRetry(OVERPASS_URL, body, 6000);
      const data = await res.json();
      const places = placesFromElements(data.elements || [], lat, lng, radiusMeters);
      cacheByKey.set(key, places);
      writeStoredPlaces(skey, places);
      console.warn(`[GramIntel] Loaded ${places.length} places near ${lat.toFixed(3)},${lng.toFixed(3)}`);
      return places;
    } catch (err) {
      console.error("[GramIntel] Overpass failed for", lat, lng, err);
      const empty: RealPlace[] = [];
      cacheByKey.set(key, empty);
      return empty;
    } finally {
      pendingByKey.delete(key);
    }
  })();

  pendingByKey.set(key, promise);
  return promise;
}

export async function fetchRealPlaces(): Promise<RealPlace[]> {
  if (realCache) return realCache;
  if (realPromise) return realPromise;

  realPromise = (async () => {
    try {
      const places = await fetchPlacesNear(CENTER.lat, CENTER.lng, RADIUS_METERS);
      realCache = places;
      return places;
    } catch (err) {
      console.error("[GramIntel] Overpass API failed:", err);
      realCache = [];
      return realCache;
    } finally {
      realPromise = null;
    }
  })();

  return realPromise;
}

export function getCategoryIcon(cat: PlaceCategory): string {
  switch (cat) {
    case "market": return "ShoppingBasket";
    case "food": return "Utensils";
    case "retail": return "Store";
    case "healthcare": return "Hospital";
    case "education": return "GraduationCap";
    case "finance": return "Landmark";
    case "transport": return "Fuel";
    case "landmark": return "Star";
    case "business": return "Briefcase";
    default: return "MapPin";
  }
}

export function getCategoryLabel(cat: PlaceCategory): string {
  switch (cat) {
    case "market": return "Market";
    case "food": return "Food & Dining";
    case "retail": return "Retail";
    case "healthcare": return "Healthcare";
    case "education": return "Education";
    case "finance": return "Finance";
    case "transport": return "Transport";
    case "landmark": return "Famous Places";
    case "business": return "Business";
    default: return "All";
  }
}

export function getCategoryColor(cat: PlaceCategory): string {
  switch (cat) {
    case "market": return "#E3B75B";
    case "food": return "#D97A2B";
    case "retail": return "#A9C3AE";
    case "healthcare": return "#E25C5C";
    case "education": return "#7FA98F";
    case "finance": return "#C8912D";
    case "transport": return "#6B8FBF";
    case "landmark": return "#F59E0B";
    case "business": return "#9B8EC4";
    default: return "#A9C3AE";
  }
}
