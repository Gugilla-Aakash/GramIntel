/**
 * GRAMINTEL — MAP STORY LOCATIONS
 * --------------------------------
 * Five real Telangana locations that demonstrate different
 * rural/semi-urban economic contexts. The scroll story
 * travels through them in sequence.
 *
 * Camera: latitude, longitude, zoom, bearing, pitch.
 * Keep all config here — never scatter coordinates in JSX.
 */

export type MapStoryLocation = {
  id: string;
  n: string; // 01–05
  name: string;
  subtitle: string; // district · state
  lat: number;
  lng: number;
  zoom: number;
  pitch: number;
  bearing: number;
  narrative: string;
  intelligenceLabel: string;
  intelligenceDetail: string;
  metric: { label: string; value: string; sub: string };
  dataStatus: "verified" | "estimate" | "demo";
  context: string; // short economic context for docs
};

export const MAP_STORY: readonly MapStoryLocation[] = [
  {
    id: "gandipet",
    n: "01",
    name: "Gandipet",
    subtitle: "Hyderabad · Telangana",
    lat: 17.3835,
    lng: 78.3222,
    zoom: 12.6,
    pitch: 18,
    bearing: -8,
    narrative: "Start with your own local economy.",
    intelligenceLabel: "LOCAL MARKET",
    intelligenceDetail: "5 km market reach · real local roads & places",
    metric: { label: "EST. CONSUMERS", value: "12,480", sub: "10 km · AI estimate" },
    dataStatus: "estimate",
    context: "peri-urban / high-density market",
  },
  {
    id: "warangal",
    n: "02",
    name: "Warangal",
    subtitle: "Warangal · Telangana",
    lat: 17.9689,
    lng: 79.5941,
    zoom: 12.0,
    pitch: 12,
    bearing: 4,
    narrative: "A regional market changes the scale of opportunity.",
    intelligenceLabel: "REGIONAL DEMAND",
    intelligenceDetail: "Textiles · agriculture · regional distribution",
    metric: { label: "REGIONAL REACH", value: "~3.2L", sub: "40 km · estimate" },
    dataStatus: "estimate",
    context: "regional commercial / agricultural economy",
  },
  {
    id: "nizamabad",
    n: "03",
    name: "Nizamabad",
    subtitle: "Nizamabad · Telangana",
    lat: 18.6725,
    lng: 78.0941,
    zoom: 12.2,
    pitch: 14,
    bearing: 6,
    narrative: "Local production creates local opportunity.",
    intelligenceLabel: "SUPPLY + DEMAND",
    intelligenceDetail: "Agriculture · food processing · dairy",
    metric: { label: "SUPPLY NODES", value: "18", sub: "co-ops & markets · demo" },
    dataStatus: "demo",
    context: "agricultural and food-processing economy",
  },
  {
    id: "karimnagar",
    n: "04",
    name: "Karimnagar",
    subtitle: "Karimnagar · Telangana",
    lat: 18.4386,
    lng: 79.1288,
    zoom: 12.1,
    pitch: 16,
    bearing: -6,
    narrative: "Competition reveals what the market still lacks.",
    intelligenceLabel: "COMPETITION GAP",
    intelligenceDetail: "Retail density · services · small manufacturing",
    metric: { label: "GAP SIGNAL", value: "Value-add gap", sub: "low competition · estimate" },
    dataStatus: "estimate",
    context: "semi-urban + agricultural economy",
  },
  {
    id: "khammam",
    n: "05",
    name: "Khammam",
    subtitle: "Khammam · Telangana",
    lat: 17.2473,
    lng: 80.1514,
    zoom: 12.3,
    pitch: 18,
    bearing: 10,
    narrative: "Turn geographic signals into a business decision.",
    intelligenceLabel: "BUSINESS OPPORTUNITY",
    intelligenceDetail: "Market + transport + distribution · opportunity overlay",
    metric: { label: "OPPORTUNITY", value: "78/100", sub: "Good potential · estimate" },
    dataStatus: "estimate",
    context: "agriculture + trade + rural markets",
  },
] as const;

export const NUM_STAGES = MAP_STORY.length;

/** Linear interpolation helper */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Interpolate camera between two stages given local t 0→1 */
export function interpolateCamera(
  from: MapStoryLocation,
  to: MapStoryLocation,
  t: number
): { lng: number; lat: number; zoom: number; pitch: number; bearing: number } {
  // ease slightly for natural feel, but keep scrub reversible
  const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad
  // zoom dips in the middle to show regional context
  const zoomMidDip = Math.sin(Math.PI * eased) * 1.2; // max -1.2 at mid
  return {
    lng: lerp(from.lng, to.lng, eased),
    lat: lerp(from.lat, to.lat, eased),
    zoom: lerp(from.zoom, to.zoom, eased) - zoomMidDip,
    pitch: lerp(from.pitch, to.pitch, eased),
    bearing: lerp(from.bearing, to.bearing, eased),
  };
}

/** Get camera for global progress 0→1 — smooth linear */
export function cameraForProgress(progress: number): {
  lng: number;
  lat: number;
  zoom: number;
  pitch: number;
  bearing: number;
  stage: number;
  localT: number;
} {
  const clamped = Math.max(0, Math.min(0.999999, progress));
  const scaled = clamped * (NUM_STAGES - 1);
  const stage = Math.floor(scaled);
  const localT = scaled - stage;
  const from = MAP_STORY[stage];
  const to = MAP_STORY[Math.min(stage + 1, NUM_STAGES - 1)];
  if (stage >= NUM_STAGES - 1) {
    return { lng: from.lng, lat: from.lat, zoom: from.zoom, pitch: from.pitch, bearing: from.bearing, stage, localT: 0 };
  }
  const cam = interpolateCamera(from, to, localT);
  return { ...cam, stage, localT };
}

/** Cinematic quick-transition variant — holds each stage, snaps in last 15% */
export function cameraForProgressQuick(progress: number): {
  lng: number;
  lat: number;
  zoom: number;
  pitch: number;
  bearing: number;
  stage: number;
  localT: number;
} {
  const clamped = Math.max(0, Math.min(0.999999, progress));
  const scaled = clamped * (NUM_STAGES - 1);
  let stage = Math.floor(scaled);
  let localT = scaled - stage;
  // hold 82% of each stage, then snap 18% — cinematic
  const HOLD = 0.82;
  let quickT: number;
  if (stage >= NUM_STAGES - 1) {
    stage = NUM_STAGES - 1;
    quickT = 0;
  } else if (localT < HOLD) {
    quickT = 0;
  } else {
    quickT = (localT - HOLD) / (1 - HOLD);
    // easeOutCubic for snappy travel
    quickT = 1 - Math.pow(1 - quickT, 3);
  }
  const from = MAP_STORY[stage];
  const to = MAP_STORY[Math.min(stage + 1, NUM_STAGES - 1)];
  if (stage >= NUM_STAGES - 1 || quickT === 0) {
    return { lng: from.lng, lat: from.lat, zoom: from.zoom, pitch: from.pitch, bearing: from.bearing, stage, localT: quickT };
  }
  const cam = interpolateCamera(from, to, quickT);
  return { ...cam, stage, localT: quickT };
}
