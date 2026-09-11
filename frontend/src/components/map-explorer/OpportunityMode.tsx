"use client";

import { opportunitySignal } from "@/lib/explorer-stats";
import type { RealPlace } from "@/lib/places";
import {
  DataConfidenceBadge,
  type Confidence,
} from "../data-source/DataConfidenceBadge";
import { useUiLang } from "@/lib/landing-strings";
import { categoryText, uiText } from "@/lib/ui-strings";

// Mirrors backend business categories — see backend/app/services/feasibility.py:6-24
const OPPORTUNITY_CATEGORIES = [
  "Dairy",
  "Retail",
  "Food",
  "Services",
  "Textile",
  "Grocery",
  "Healthcare",
  "Education",
  "Agriculture",
  "Transport",
  "Finance",
  "Manufacturing",
  "Hospitality",
  "Repair",
  "Beauty",
  "Livestock",
  "Other",
] as const;

interface OpportunityModeProps {
  places: RealPlace[];
  radiusKm?: number;
  category: string;
  onCategoryChange: (c: string) => void;
  source: Confidence;
}

export function OpportunityMode({
  places,
  radiusKm = 8,
  category,
  onCategoryChange,
  source,
}: OpportunityModeProps) {
  const lang = useUiLang();
  const snap = opportunitySignal(category, places, radiusKm);
  return (
    <section className="mx-opp" aria-label={uiText(lang, "OPPORTUNITY_CHECK")}>
      <div className="mx-panel-head">
        <h2 className="mx-panel-title">{uiText(lang, "OPPORTUNITY_CHECK")}</h2>
        <DataConfidenceBadge status={source} />
      </div>
      <label className="mx-label" htmlFor="mx-opp-cat">
        {uiText(lang, "BUSINESS_CATEGORY")}
      </label>
      <select
        id="mx-opp-cat"
        className="mx-select"
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        {OPPORTUNITY_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {categoryText(lang, c)}
          </option>
        ))}
      </select>
      <dl className="mx-stats">
        <div>
          <dt>{uiText(lang, "NEARBY_COMPETITORS")}</dt>
          <dd>{snap.competitors}</dd>
        </div>
        <div>
          <dt>{uiText(lang, "CLOSEST")}</dt>
          <dd>{snap.closestKm != null ? `${snap.closestKm.toFixed(1)} km` : "—"}</dd>
        </div>
        <div>
          <dt>{uiText(lang, "DENSITY")}</dt>
          <dd>{snap.density}</dd>
        </div>
        <div>
          <dt>{uiText(lang, "SIGNAL")}</dt>
          <dd>{snap.signal}</dd>
        </div>
      </dl>
      <p className="mx-why">{snap.why}</p>
      <p className="mx-caption">
        {uiText(lang, "MAP_SIGNALS_NOTE")}
      </p>
    </section>
  );
}
