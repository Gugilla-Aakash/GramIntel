import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  avgDistance,
  categoryBreakdown,
  densityBand,
  dominantCategory,
  opportunitySignal,
} from "../explorer-stats";
import type { RealPlace } from "../places";

function place(overrides: Partial<RealPlace> & { id: number }): RealPlace {
  return {
    name: `Place ${overrides.id}`,
    category: "retail",
    lat: 17.3835,
    lng: 78.3222,
    distanceKm: 1,
    source: "osm",
    ...overrides,
  };
}

describe("densityBand", () => {
  it("rates 3 places in 5km as Low", () => {
    assert.equal(densityBand(3, 5), "Low");
  });

  it("rates dense areas as High", () => {
    assert.equal(densityBand(100, 5), "High");
  });

  it("rates mid-density areas as Moderate", () => {
    assert.equal(densityBand(30, 5), "Moderate");
  });
});

describe("dominantCategory", () => {
  it("picks the category with max count", () => {
    const places = [
      place({ id: 1, category: "retail" }),
      place({ id: 2, category: "food" }),
      place({ id: 3, category: "food" }),
    ];
    assert.equal(dominantCategory(places), "food");
  });

  it("returns empty string for no places", () => {
    assert.equal(dominantCategory([]), "");
  });
});

describe("avgDistance", () => {
  it("returns null for empty array", () => {
    assert.equal(avgDistance([]), null);
  });

  it("rounds the mean to 1 decimal", () => {
    const places = [
      place({ id: 1, distanceKm: 1.04 }),
      place({ id: 2, distanceKm: 2.05 }),
    ];
    assert.equal(avgDistance(places), 1.5);
  });
});

describe("categoryBreakdown", () => {
  it("counts per category sorted descending", () => {
    const places = [
      place({ id: 1, category: "retail" }),
      place({ id: 2, category: "food" }),
      place({ id: 3, category: "food" }),
    ];
    assert.deepEqual(categoryBreakdown(places), [
      { cat: "food", count: 2 },
      { cat: "retail", count: 1 },
    ]);
  });
});

describe("opportunitySignal", () => {
  it("returns No data for an empty area", () => {
    const result = opportunitySignal("retail", []);
    assert.equal(result.signal, "No data");
    assert.equal(result.competitors, 0);
    assert.equal(result.closestKm, null);
    assert.ok(result.why.length > 0);
  });

  it("flags zero competitors as a potential opportunity", () => {
    const places = [place({ id: 1, category: "food", distanceKm: 1.2 })];
    const result = opportunitySignal("retail", places);
    assert.equal(result.signal, "Potential opportunity");
    assert.equal(
      result.why,
      "No retail businesses found in this search area — verify on the ground"
    );
  });

  it("flags 1-3 competitors as a potential opportunity with distance", () => {
    const places = [
      place({ id: 1, category: "retail", distanceKm: 0.8 }),
      place({ id: 2, category: "retail", distanceKm: 2.4 }),
    ];
    const result = opportunitySignal("retail", places);
    assert.equal(result.signal, "Potential opportunity");
    assert.equal(result.competitors, 2);
    assert.equal(result.closestKm, 0.8);
  });

  it("flags 4-8 competitors as Competitive", () => {
    const places = [1, 2, 3, 4, 5].map((id) =>
      place({ id, category: "retail", distanceKm: id * 0.5 })
    );
    assert.equal(opportunitySignal("retail", places).signal, "Competitive");
  });

  it("flags more than 8 competitors as Saturated", () => {
    const places = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((id) =>
      place({ id, category: "retail", distanceKm: id * 0.5 })
    );
    assert.equal(opportunitySignal("retail", places).signal, "Saturated");
  });
});
