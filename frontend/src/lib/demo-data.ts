/**
 * GRAMINTEL — CENTRALIZED DEMO DATASET
 * ------------------------------------
 * Single source of truth for every number shown on the landing page.
 *
 * dataStatus semantics:
 *   "verified"  — from a genuine public / government / open dataset
 *   "estimate"  — computed by the GramIntel analytical model (AI ESTIMATE)
 *   "demo"      — realistic simulated value for the prototype (DEMO DATA)
 *
 * When the real backend lands, this object is replaced by API responses
 * carrying the same shape — and the UI badges update automatically.
 */

export type DataStatus = "verified" | "estimate" | "demo";

export interface WithSource<T> {
  value: T;
  status: DataStatus;
  note?: string;
}

export const demoData = {
  scenario: {
    label: "DEMO SCENARIO",
    description:
      "All figures below are simulated for this prototype. In production they are computed from open datasets, satellite imagery and local price feeds for the user's own village.",
  },

  location: {
    village: "Gandipet",
    block: "Gandipet",
    district: "Hyderabad",
    state: "Telangana",
    /** MapLibre order: [lng, lat] */
    coords: [78.3222, 17.3835] as [number, number],
    status: "demo" as DataStatus,
  },

  market: {
    radiusKm: 10,
    estimatedConsumers: { value: 12480, status: "estimate" as DataStatus },
    similarBusinesses: { value: 17, status: "demo" as DataStatus },
    avgDistanceKm: { value: 3.4, status: "estimate" as DataStatus },
    monthlyDemandInrLakh: { value: 8.4, status: "estimate" as DataStatus },
    priceRangeInr: { value: [58, 62] as [number, number], status: "estimate" as DataStatus, note: "per kg · value-added dairy" },
  },

  opportunity: {
    score: { value: 78, status: "estimate" as DataStatus },
    grade: "GOOD POTENTIAL",
    category: "Value-added dairy products",
    factors: [
      { label: "MARKET DEMAND", v: 82, note: "rising milk spend in radius" },
      { label: "COMPETITION", v: 61, note: "none value-added nearby" },
      { label: "PRICING POWER", v: 72, note: "12–18% premium achievable" },
      { label: "SUPPLY ACCESS", v: 79, note: "3 co-ops within 6 km" },
      { label: "FINANCIAL FIT", v: 81, note: "matches term-loan structure" },
      { label: "RISK EXPOSURE", v: 52, note: "seasonal dips · power supply" },
    ],
  },

  finance: {
    margin: 100000, // ₹1,00,000 beneficiary share
    projectCost: 1000000, // ₹10,00,000
    loan: 900000, // ₹9,00,000 institutional
    interestPct: 8,
    tenureYears: 7,
    moratoriumMonths: 6,
    illustrative: true,
  },

  repayment: {
    monthlyRevenue: 85000,
    operatingCosts: 57000, // includes working-capital holding of ₹14,500
    workingCapitalWithinCosts: 14500,
    // EMI is computed deterministically at runtime — see calcEMI() in map-data.ts
  },
} as const;

export type DemoData = typeof demoData;
