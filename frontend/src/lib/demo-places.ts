import { kmDistance, type PlaceCategory, type RealPlace } from "./places";
import { kmToDegLat, kmToDegLng } from "./map-data";
import { mulberry32 } from "./utils";

const DEMO_SPOTS: Array<{ name: string; category: PlaceCategory }> = [
  { name: "Sri Lakshmi Kirana", category: "retail" },
  { name: "Gandipet Milk Point", category: "food" },
  { name: "Annapurna Tiffin Center", category: "food" },
  { name: "Sri Sai Medical Store", category: "healthcare" },
  { name: "Venkatesh Tailors", category: "business" },
  { name: "Raju Mobile Point", category: "retail" },
  { name: "Lakshmi Vegetable Market", category: "market" },
  { name: "New Look Salon", category: "business" },
  { name: "Sri Balaji Auto Garage", category: "transport" },
  { name: "Kaveri Rice Depot", category: "market" },
  { name: "Padma Dairy Farm", category: "food" },
  { name: "Suresh Poultry Farm", category: "food" },
  { name: "Green Leaf Nursery", category: "market" },
  { name: "Sri Durga Hardware", category: "retail" },
  { name: "Amma Handlooms", category: "retail" },
  { name: "City Style Footwear", category: "retail" },
  { name: "Fresh Chicken Center", category: "food" },
  { name: "Rao Tea Stall", category: "food" },
  { name: "Shilpa Beauty Parlour", category: "business" },
  { name: "Star Dry Cleaners", category: "business" },
];

function seedFrom(lat: number, lng: number): number {
  const s = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function buildDemoPlaces(lat: number, lng: number, radiusKm: number): RealPlace[] {
  const rnd = mulberry32(seedFrom(lat, lng));
  const count = Math.min(DEMO_SPOTS.length, 10 + Math.round(radiusKm));
  const out: RealPlace[] = [];
  for (let i = 0; i < count; i++) {
    const spot = DEMO_SPOTS[i % DEMO_SPOTS.length];
    const angle = rnd() * Math.PI * 2;
    const distKm = radiusKm * (0.06 + 0.55 * Math.pow(rnd(), 1.3));
    const plat = lat + kmToDegLat(distKm) * Math.sin(angle);
    const plng = lng + kmToDegLng(distKm, lat) * Math.cos(angle);
    out.push({
      id: -(1000 + i),
      name: spot.name,
      category: spot.category,
      lat: plat,
      lng: plng,
      distanceKm: Math.round(kmDistance(lat, lng, plat, plng) * 10) / 10,
      source: "demo",
    });
  }
  return out.sort((a, b) => a.distanceKm - b.distanceKm);
}

const ASSISTANT_TO_OSM: Record<string, PlaceCategory> = {
  Dairy: "food",
  Retail: "retail",
  Textile: "retail",
  "Food Processing": "food",
  Poultry: "food",
  Kirana: "retail",
  Services: "business",
  Food: "food",
};

export interface ApprovedFeedItem {
  id: number;
  village: string;
  district: string;
  business_category: string;
}

export function fundedToPlace(
  item: ApprovedFeedItem,
  flat: number,
  flng: number,
  centerLat: number,
  centerLng: number
): RealPlace {
  const jLat = (((item.id * 37) % 11) - 5) * 0.0009;
  const jLng = (((item.id * 53) % 11) - 5) * 0.0009;
  const lat = flat + jLat;
  const lng = flng + jLng;
  return {
    id: -(1000000 + item.id),
    name: `${item.village} ${item.business_category} unit`,
    category: ASSISTANT_TO_OSM[item.business_category] ?? "business",
    lat,
    lng,
    distanceKm: Math.round(kmDistance(centerLat, centerLng, lat, lng) * 10) / 10,
    source: "gramintel",
  };
}
