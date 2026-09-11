import type { RealPlace } from "./places";

export type DensityBand = "Low" | "Moderate" | "High";
export type OpportunitySignalLabel =
  | "Potential opportunity"
  | "Competitive"
  | "Saturated"
  | "No data";

export interface CategoryCount {
  cat: string;
  count: number;
}

export interface OpportunitySnapshot {
  competitors: number;
  closestKm: number | null;
  density: DensityBand;
  signal: OpportunitySignalLabel;
  why: string;
}

export function densityBand(count: number, radiusKm: number): DensityBand {
  if (!Number.isFinite(count) || !Number.isFinite(radiusKm) || radiusKm <= 0 || count <= 0) return "Low";
  const perKm2 = count / (Math.PI * radiusKm * radiusKm);
  if (perKm2 < 0.2) return "Low"; // <0.2 places per km² → Low
  if (perKm2 < 1) return "Moderate"; // 0.2–<1 places per km² → Moderate
  return "High"; // ≥1 place per km² → High
}

export function dominantCategory(places: RealPlace[]): string {
  if (!places || places.length === 0) return "";
  const counts: Record<string, number> = {};
  for (const p of places) counts[p.category] = (counts[p.category] ?? 0) + 1;
  let best = "";
  let bestN = -1;
  for (const cat of Object.keys(counts)) {
    if (counts[cat] > bestN) {
      best = cat;
      bestN = counts[cat];
    }
  }
  return best;
}

export function avgDistance(places: RealPlace[]): number | null {
  if (!places || places.length === 0) return null;
  const sum = places.reduce((acc, p) => acc + p.distanceKm, 0);
  return Math.round((sum / places.length) * 10) / 10;
}

export function categoryBreakdown(places: RealPlace[]): CategoryCount[] {
  const counts: Record<string, number> = {};
  for (const p of places ?? []) counts[p.category] = (counts[p.category] ?? 0) + 1;
  return Object.keys(counts)
    .map((cat) => ({ cat, count: counts[cat] }))
    .sort((a, b) => b.count - a.count);
}

export function opportunitySignal(
  cat: string,
  places: RealPlace[],
  radiusKm = 8
): OpportunitySnapshot {
  const all = places ?? [];
  if (all.length === 0) {
    return {
      competitors: 0,
      closestKm: null,
      density: "Low",
      signal: "No data",
      why: "No business data loaded for this area yet.",
    };
  }
  const matches = all.filter((p) => p.category === cat);
  const competitors = matches.length;
  const closestKm =
    competitors === 0
      ? null
      : Math.round(Math.min(...matches.map((p) => p.distanceKm)) * 10) / 10;
  const density = densityBand(competitors, radiusKm);
  if (competitors === 0) {
    return {
      competitors,
      closestKm,
      density,
      signal: "Potential opportunity", // 0 competitors → Potential opportunity
      why: `No ${cat} businesses found in this search area — verify on the ground`,
    };
  }
  if (competitors <= 3) {
    return {
      competitors,
      closestKm,
      density,
      signal: "Potential opportunity", // 1–3 competitors → Potential opportunity
      why: `${competitors} ${cat} ${competitors === 1 ? "business" : "businesses"} found, closest ${closestKm} km away — verify on the ground`,
    };
  }
  if (competitors <= 8) {
    return {
      competitors,
      closestKm,
      density,
      signal: "Competitive", // 4–8 competitors → Competitive
      why: `${competitors} ${cat} businesses nearby, closest ${closestKm} km away — expect competition`,
    };
  }
  return {
    competitors,
    closestKm,
    density,
    signal: "Saturated", // >8 competitors → Saturated
    why: `${competitors} ${cat} businesses nearby, closest ${closestKm} km away — area looks saturated`,
  };
}
