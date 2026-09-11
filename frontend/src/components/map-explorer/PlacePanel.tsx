"use client";

import { categoryBreakdown } from "@/lib/explorer-stats";
import {
  getCategoryColor,
  getCategoryLabel,
  type PlaceCategory,
  type RealPlace,
} from "@/lib/places";
import {
  DataConfidenceBadge,
  type Confidence,
} from "../data-source/DataConfidenceBadge";
import { useUiLang } from "@/lib/landing-strings";
import { categoryText, uiText } from "@/lib/ui-strings";

interface PlacePanelProps {
  places: RealPlace[];
  activeCat: PlaceCategory;
  setActiveCat: (c: PlaceCategory) => void;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  source: Confidence;
  loading: boolean;
}

export function PlacePanel({
  places,
  activeCat,
  setActiveCat,
  selectedId,
  onSelect,
  source,
  loading,
}: PlacePanelProps) {
  const lang = useUiLang();
  const breakdown = categoryBreakdown(places);
  const visible =
    activeCat === "all" ? places : places.filter((p) => p.category === activeCat);

  return (
    <section className="mx-panel" aria-label={uiText(lang, "NEARBY_BUSINESSES")}>
      <div className="mx-panel-head">
        <h2 className="mx-panel-title">{uiText(lang, "NEARBY_BUSINESSES")}</h2>
        <span className="mx-count" aria-live="polite">
          {loading ? uiText(lang, "LOADING") : `${visible.length}`}
        </span>
        <DataConfidenceBadge status={source} />
      </div>
      <div className="mx-chips" role="group" aria-label={uiText(lang, "FILTER_CATEGORY")}>
        <button
          type="button"
          className="gi-filter-chip"
          data-active={activeCat === "all"}
          aria-pressed={activeCat === "all"}
          onClick={() => setActiveCat("all")}
        >
          {uiText(lang, "ALL")}
        </button>
        {breakdown.map(({ cat, count }) => {
          const c = cat as PlaceCategory;
          return (
            <button
              key={cat}
              type="button"
              className="gi-filter-chip"
              data-active={activeCat === c}
              aria-pressed={activeCat === c}
              onClick={() => setActiveCat(c)}
            >
              <span
                className="mx-dot"
                style={{ background: getCategoryColor(c) }}
                aria-hidden="true"
              />
              {categoryText(lang, getCategoryLabel(c))} · {count}
            </button>
          );
        })}
      </div>
      {loading ? (
        <div className="mx-rows" aria-label={`${uiText(lang, "LOADING")} ${uiText(lang, "BUSINESSES")}`}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="mx-row mx-row-skeleton" aria-hidden="true" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="mx-empty">
          {uiText(lang, "NO_BUSINESSES")}
        </p>
      ) : (
        <ul
          className="mx-rows"
          role="listbox"
          aria-label={uiText(lang, "BUSINESSES")}
          aria-activedescendant={
            selectedId != null ? `mx-place-${selectedId}` : undefined
          }
        >
          {visible.map((p) => (
            <li key={p.id} role="presentation">
              <button
                type="button"
                role="option"
                id={`mx-place-${p.id}`}
                aria-selected={selectedId === p.id}
                data-active={selectedId === p.id}
                className="mx-row"
                onClick={() => onSelect(selectedId === p.id ? null : p.id)}
              >
                <span className="mx-row-main">
                  <span className="mx-row-name">{p.name}</span>
                  <span className="mx-row-sub">
                    <span
                      className="mx-dot"
                      style={{ background: getCategoryColor(p.category) }}
                      aria-hidden="true"
                    />
                    {categoryText(lang, getCategoryLabel(p.category))} · {p.distanceKm.toFixed(1)} km
                  </span>
                </span>
                <span className="mx-source">
                  {p.source === "gramintel"
                    ? "GramIntel"
                    : p.source === "demo"
                      ? "Demo"
                      : "OSM"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
