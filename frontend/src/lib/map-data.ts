/**
 * GRAMINTEL — MAP DATA ARCHITECTURE
 * ---------------------------------
 * GeoJSON-compatible layer definitions for the MapLibre visualisation.
 * Nothing here knows about rendering — the map component consumes these
 * structures, so real datasets can replace the demo generator wholesale.
 *
 * Entity shape (future backend contract):
 * {
 *   name, category, location: [lng, lat], source, confidence, dataType
 * }
 */

import { mulberry32 } from "./utils";
import { demoData } from "./demo-data";

export type LayerKind =
  | "location"
  | "business"
  | "competitor"
  | "consumer"
  | "supplier"
  | "market"
  | "transport"
  | "risk"
  | "opportunity";

export interface MapEntity {
  name: string;
  kind: LayerKind;
  category?: string;
  location: [number, number];
  /** distance from the demo village centre, km */
  distanceKm?: number;
  status: "verified" | "estimate" | "demo";
}

export const CATEGORY_COLORS: Record<string, string> = {
  Dairy: "#E3B75B",
  Retail: "#A9C3AE",
  Food: "#D97A2B",
  Services: "#7FA98F",
  Textile: "#C98AA6",
};

/* ────────── geometry helpers ────────── */

const KM_PER_DEG_LAT = 110.574;

export function kmToDegLat(km: number) {
  return km / KM_PER_DEG_LAT;
}

export function kmToDegLng(km: number, lat: number) {
  return km / (111.32 * Math.cos((lat * Math.PI) / 180));
}

/** Circle polygon (GeoJSON) around a centre — used for market radius rings. */
export function circlePolygon(
  center: [number, number],
  radiusKm: number,
  steps = 72
): GeoJSON.Feature<GeoJSON.Polygon> {
  const [lng0, lat0] = center;
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    coords.push([
      lng0 + kmToDegLng(radiusKm, lat0) * Math.cos(t),
      lat0 + kmToDegLat(radiusKm) * Math.sin(t),
    ]);
  }
  return {
    type: "Feature",
    properties: { radiusKm },
    geometry: { type: "Polygon", coordinates: [coords] },
  };
}

/** Irregular organic blob — used for the estimated opportunity region. */
export function blobPolygon(
  center: [number, number],
  radiusKm: number,
  seed = 7,
  wobble = 0.35,
  steps = 40
): GeoJSON.Feature<GeoJSON.Polygon> {
  const rnd = mulberry32(seed);
  const phases = [rnd() * Math.PI * 2, rnd() * Math.PI * 2];
  const [lng0, lat0] = center;
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const r =
      radiusKm *
      (1 +
        wobble * Math.sin(2 * t + phases[0]) * 0.5 +
        wobble * 0.5 * Math.sin(3 * t + phases[1]));
    coords.push([
      lng0 + kmToDegLng(r, lat0) * Math.cos(t) * 1.15,
      lat0 + kmToDegLat(r) * Math.sin(t) * 0.85,
    ]);
  }
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [coords] },
  };
}

/* ────────── demo entity generation ────────── */

const BUSINESS_CATEGORIES = [
  "Dairy",
  "Retail",
  "Retail",
  "Food",
  "Retail",
  "Services",
  "Dairy",
  "Food",
  "Textile",
  "Retail",
  "Services",
  "Dairy",
  "Food",
  "Retail",
  "Textile",
  "Services",
  "Food",
] as const;

const BUSINESS_NAMES = [
  "Sri Lakshmi Kirana",
  "Gandipet Milk Point",
  "New Style Tailors",
  "Anjaneya Tea Stall",
  "Green Valley Stores",
  "Sai Mobile Repair",
  "Amul Collection Centre",
  "Tiffin Corner",
  "Renuka Sarees",
  "Daily Needs Mart",
  "Sri Vidya Xerox",
  "Goshala Dairy",
  "Chaat House",
  "Ramdev Provisions",
  "Weaving Works",
  "Auto Service Point",
  "Fresh Juice Bar",
];

/** The 17 similar businesses around the demo village. status: demo */
export function buildCompetitors(): MapEntity[] {
  const rnd = mulberry32(31337);
  return BUSINESS_CATEGORIES.map((category, i) => {
    const ang = rnd() * Math.PI * 2;
    const dist = 0.8 + rnd() * 8.4;
    const [lng0, lat0] = demoData.location.coords;
    return {
      name: BUSINESS_NAMES[i],
      kind: "competitor" as const,
      category,
      location: [
        lng0 + kmToDegLng(dist, lat0) * Math.cos(ang),
        lat0 + kmToDegLat(dist) * Math.sin(ang) * 0.92,
      ] as [number, number],
      distanceKm: Math.round(dist * 10) / 10,
      status: "demo" as const,
    };
  });
}

/** Consumer-density sample points inside the 10 km radius. status: estimate */
export function buildConsumers(count = 140): MapEntity[] {
  const rnd = mulberry32(90210);
  const [lng0, lat0] = demoData.location.coords;
  return Array.from({ length: count }, () => {
    // bias density toward the south-west quarter (the underserved pocket)
    const biased = rnd() < 0.55;
    const ang = biased ? Math.PI * (1 + rnd()) : rnd() * Math.PI * 2;
    const dist = Math.sqrt(rnd()) * 9.6;
    return {
      name: "Consumer cluster",
      kind: "consumer" as const,
      location: [
        lng0 + kmToDegLng(dist, lat0) * Math.cos(ang),
        lat0 + kmToDegLat(dist) * Math.sin(ang),
      ] as [number, number],
      distanceKm: Math.round(dist * 10) / 10,
      status: "estimate" as const,
    };
  });
}

/** Supplier & collection points (dairy co-ops, feed, vet). status: demo */
export function buildSuppliers(): MapEntity[] {
  const [lng0, lat0] = demoData.location.coords;
  return [
    { name: "Milk Co-operative 1", km: 2.1, brg: -40 },
    { name: "Milk Co-operative 2", km: 4.8, brg: 150 },
    { name: "Cattle Feed Depot", km: 5.9, brg: 80 },
    { name: "Veterinary Centre", km: 3.2, brg: -120 },
    { name: "Cold Storage Hub", km: 7.4, brg: 20 },
  ].map(({ name, km, brg }) => ({
    name,
    kind: "supplier" as const,
    category: "Supply chain",
    location: [
      lng0 + kmToDegLng(km, lat0) * Math.cos((brg * Math.PI) / 180),
      lat0 + kmToDegLat(km) * Math.sin((brg * Math.PI) / 180),
    ] as [number, number],
    distanceKm: km,
    status: "demo" as const,
  }));
}

/** Transport corridors feeding the village market. status: demo */
export function buildTransportRoutes(): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  const [lng0, lat0] = demoData.location.coords;
  const route = (bearing: number, km: number): GeoJSON.Feature<GeoJSON.LineString> => {
    const pts: [number, number][] = [];
    for (let d = 0; d <= km; d += km / 12) {
      const wob = Math.sin(d * 1.4 + bearing) * 0.25;
      pts.push([
        lng0 +
          kmToDegLng(d, lat0) * Math.cos(((bearing + wob * 20) * Math.PI) / 180),
        lat0 + kmToDegLat(d) * Math.sin(((bearing + wob * 20) * Math.PI) / 180),
      ]);
    }
    return {
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: pts },
    };
  };
  return {
    type: "FeatureCollection",
    features: [route(-35, 9), route(155, 7.5), route(95, 5)],
  };
}

/** Estimated underserved pocket — the AI-flagged opportunity region. status: estimate */
export function buildOpportunityRegion(): GeoJSON.Feature<GeoJSON.Polygon> {
  const [lng0, lat0] = demoData.location.coords;
  // pocket sits ~4.5 km SW of the village centre
  const c: [number, number] = [
    lng0 - kmToDegLng(3.4, lat0),
    lat0 - kmToDegLat(3.1),
  ];
  return blobPolygon(c, 2.6, 11, 0.42);
}

/* ────────── deterministic finance ────────── */

/** Standard reducing-balance EMI. Deterministic and verifiable. */
export function calcEMI(principal: number, annualRatePct: number, months: number) {
  const r = annualRatePct / 12 / 100;
  if (r === 0) return principal / months;
  const f = Math.pow(1 + r, months);
  return (principal * r * f) / (f - 1);
}
