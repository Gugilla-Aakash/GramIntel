"use client";

import { getCategoryColor, getCategoryLabel, type RealPlace } from "@/lib/places";
import { useUiLang } from "@/lib/landing-strings";
import { categoryText, uiText } from "@/lib/ui-strings";

interface PlaceCardProps {
  place: RealPlace | null;
  onClose: () => void;
  onViewOnMap: (id: number) => void;
}

export function PlaceCard({ place, onClose, onViewOnMap }: PlaceCardProps) {
  const lang = useUiLang();
  if (!place) return null;
  return (
    <article className="mx-card" aria-label={uiText(lang, "DETAILS_FOR", { name: place.name })}>
      <div className="mx-card-head">
        <h2 className="mx-card-title">{place.name}</h2>
        <button
          type="button"
          className="mx-card-close"
          onClick={onClose}
          aria-label={uiText(lang, "CLOSE_DETAILS")}
        >
          ×
        </button>
      </div>
      <p className="mx-card-cat">
        <span
          className="mx-dot"
          style={{ background: getCategoryColor(place.category) }}
          aria-hidden="true"
        />
        {categoryText(lang, getCategoryLabel(place.category))}
      </p>
      <dl className="mx-card-facts">
        <div>
          <dt>{uiText(lang, "DISTANCE")}</dt>
          <dd>{place.distanceKm.toFixed(1)} km</dd>
        </div>
        <div>
          <dt>{uiText(lang, "LOCATION")}</dt>
          <dd>
            {place.lat.toFixed(5)}, {place.lng.toFixed(5)}
          </dd>
        </div>
      </dl>
      <p className="mx-card-note">
        {place.source === "gramintel"
          ? uiText(lang, "GRAMINTEL_FUNDED")
          : place.source === "demo"
            ? uiText(lang, "DEMO_LISTING")
            : uiText(lang, "OSM_DETAILS")}
      </p>
      <div className="mx-card-actions">
        <button
          type="button"
          className="mx-btn"
          onClick={() => onViewOnMap(place.id)}
        >
          {uiText(lang, "VIEW_ON_MAP")}
        </button>
        {place.source === "osm" && (
          <a
            className="mx-link"
            href={`https://www.openstreetmap.org/node/${place.id}`}
            target="_blank"
            rel="noreferrer"
          >
            {uiText(lang, "VIEW_ON_OSM")}
          </a>
        )}
      </div>
    </article>
  );
}
