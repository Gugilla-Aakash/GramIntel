"use client";

import {
  avgDistance,
  categoryBreakdown,
  densityBand,
  dominantCategory,
} from "@/lib/explorer-stats";
import type { RealPlace } from "@/lib/places";
import { getCategoryLabel, type PlaceCategory } from "@/lib/places";
import {
  DataConfidenceBadge,
  type Confidence,
} from "../data-source/DataConfidenceBadge";
import { DataSourceLabel } from "../data-source/DataSourceLabel";
import { useUiLang } from "@/lib/landing-strings";
import { categoryText, uiText } from "@/lib/ui-strings";

interface IntelPanelProps {
  places: RealPlace[];
  source: Confidence;
  radiusKm?: number;
}

export function IntelPanel({ places, source, radiusKm = 8 }: IntelPanelProps) {
  const lang = useUiLang();
  const count = places.length;
  const dom = dominantCategory(places);
  const avg = avgDistance(places);
  const cats = categoryBreakdown(places);
  const band = densityBand(count, radiusKm);
  return (
    <section className="mx-intel" aria-label={uiText(lang, "AREA_SIGNALS")}>
      <div className="mx-panel-head">
        <h2 className="mx-panel-title">{uiText(lang, "AREA_SIGNALS")}</h2>
        <DataConfidenceBadge status={source} />
      </div>
      <dl className="mx-stats">
        <div>
          <dt>{uiText(lang, "BUSINESSES_MAPPED")}</dt>
          <dd>{count}</dd>
        </div>
        <div>
          <dt>{uiText(lang, "DOMINANT_CATEGORY")}</dt>
          <dd>{dom ? categoryText(lang, getCategoryLabel(dom as PlaceCategory)) : "—"}</dd>
        </div>
        <div>
          <dt>{uiText(lang, "AVG_DISTANCE")}</dt>
          <dd>{avg != null ? `${avg.toFixed(1)} km` : "—"}</dd>
        </div>
        <div>
          <dt>{uiText(lang, "CATEGORIES_DETECTED")}</dt>
          <dd>{cats.length}</dd>
        </div>
        <div>
          <dt>{uiText(lang, "DENSITY_BAND")}</dt>
          <dd>{count === 0 ? uiText(lang, "NO_DATA") : band}</dd>
        </div>
      </dl>
      <DataSourceLabel
        status={source}
        note={
          source === "verified"
            ? uiText(lang, "LIVE_OSM_RESULTS")
            : uiText(lang, "CACHED_DEMO_DATA")
        }
      />
      <p className="mx-caption">
        {uiText(lang, "MAP_SIGNALS_NOTE")}
      </p>
    </section>
  );
}
