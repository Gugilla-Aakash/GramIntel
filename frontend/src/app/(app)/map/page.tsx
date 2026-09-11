"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import MapHeader from "@/components/map-explorer/MapHeader";
import SearchBar from "@/components/map-explorer/SearchBar";
import { PlacePanel } from "@/components/map-explorer/PlacePanel";
import { PlaceCard } from "@/components/map-explorer/PlaceCard";
import { IntelPanel } from "@/components/map-explorer/IntelPanel";
import { OpportunityMode } from "@/components/map-explorer/OpportunityMode";
import type { Confidence } from "@/components/data-source/DataConfidenceBadge";
import {
  fetchPlacesNear,
  fetchPlacesViaBackend,
  kmDistance,
  type PlaceCategory,
  type RealPlace,
} from "@/lib/places";
import { reverseGeocode, searchPlaces, type GeoResult } from "@/lib/geocode";
import {
  buildDemoPlaces,
  fundedToPlace,
  type ApprovedFeedItem,
} from "@/lib/demo-places";
import { useUiLang } from "@/lib/landing-strings";
import { categoryText, uiText } from "@/lib/ui-strings";

function MapLoadingState() {
  const lang = useUiLang();
  return (
    <div className="mx-map mx-map-loading" role="status" aria-label={uiText(lang, "LOADING_MAP")}>
      <span className="mx-map-loading-pill">{uiText(lang, "LOADING_MAP")}</span>
    </div>
  );
}

const ExplorerMap = dynamic(
  () => import("@/components/map-explorer/ExplorerMap"),
  {
    ssr: false,
    loading: () => <MapLoadingState />,
  }
);

const GANDIPET_CENTER: [number, number] = [78.3222, 17.3835];
const RADII_KM = [2, 5, 10] as const;

type GeoState = "idle" | "locating" | "denied" | "unsupported";

function shortLabel(name: string | null, fallback: string): string {
  if (!name) return fallback;
  const first = name.split(",")[0]?.trim();
  return first || fallback;
}

function RadiusControl({
  radiusKm,
  onChange,
}: {
  radiusKm: number;
  onChange: (km: number) => void;
}) {
  const lang = useUiLang();
  return (
    <div className="mx-radius">
      <span className="mx-radius-label" id="mx-radius-label">
        {uiText(lang, "MAP_RADIUS")}
      </span>
      <div
        className="mx-seg"
        role="group"
        aria-labelledby="mx-radius-label"
      >
        {RADII_KM.map((km) => (
          <button
            key={km}
            type="button"
            className="mx-seg-btn"
            aria-pressed={radiusKm === km}
            data-active={radiusKm === km}
            onClick={() => onChange(km)}
          >
            {km} km
          </button>
        ))}
      </div>
      <p className="mx-radius-note">
        {uiText(lang, "MAP_RADIUS_NOTE")}
      </p>
    </div>
  );
}

export default function MapExplorerPage() {
  const lang = useUiLang();
  const [center, setCenter] = useState<[number, number]>(GANDIPET_CENTER);
  const [radiusKm, setRadiusKm] = useState<number>(8);
  const [places, setPlaces] = useState<RealPlace[]>([]);
  const [funded, setFunded] = useState<RealPlace[]>([]);
  const [source, setSource] = useState<Confidence>("verified");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeCat, setActiveCat] = useState<PlaceCategory>("all");
  const [oppCategory, setOppCategory] = useState<string>("Dairy");
  const [loading, setLoading] = useState(true);
  const [geo, setGeo] = useState<GeoState>("idle");
  const [locationLabel, setLocationLabel] = useState("Gandipet");
  const [online, setOnline] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    async function load() {
      const viaBackend = await fetchPlacesViaBackend(center[1], center[0], radiusKm * 1000);
      if (cancelled) return;
      if (viaBackend.length > 0) {
        setPlaces(viaBackend);
        setSource("verified");
        setLoading(false);
        return;
      }
      const direct = await fetchPlacesNear(center[1], center[0], radiusKm * 1000);
      if (cancelled) return;
      if (direct.length > 0) {
        setPlaces(direct);
        setSource("verified");
      } else {
        setPlaces(buildDemoPlaces(center[1], center[0], radiusKm));
        setSource("demo");
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [center, radiusKm, refreshKey]);

  useEffect(() => {
    let stop = false;
    async function loadFunded() {
      try {
        const r = await fetch("/api/backend/cases/approved");
        if (!r.ok || stop) return;
        const items = (await r.json()) as ApprovedFeedItem[];
        const out: RealPlace[] = [];
        for (const c of items.slice(0, 30)) {
          const g = await searchPlaces(`${c.village}, ${c.district}`);
          if (stop || g.length === 0) continue;
          out.push(fundedToPlace(c, g[0].lat, g[0].lng, center[1], center[0]));
        }
        if (!stop) setFunded(out);
      } catch {
        if (!stop) setFunded([]);
      }
    }
    loadFunded();
    const t = window.setInterval(loadFunded, 60000);
    return () => {
      stop = true;
      window.clearInterval(t);
    };
  }, []);

  useEffect(() => {
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const visiblePlaces = useMemo(() => {
    const near = funded
      .map((p) => ({
        ...p,
        distanceKm:
          Math.round(kmDistance(center[1], center[0], p.lat, p.lng) * 10) / 10,
      }))
      .filter((p) => p.distanceKm <= radiusKm);
    return [...near, ...places];
  }, [funded, places, center, radiusKm]);

  const fundedCount = useMemo(
    () => visiblePlaces.filter((p) => p.source === "gramintel").length,
    [visiblePlaces]
  );

  const selectedPlace = useMemo(
    () => visiblePlaces.find((p) => p.id === selectedId) ?? null,
    [visiblePlaces, selectedId]
  );

  function handlePickLocation(r: GeoResult) {
    setCenter([r.lng, r.lat]);
    setLocationLabel(shortLabel(r.name, "Gandipet"));
    setSelectedId(null);
  }

  function handlePickPlace(id: number) {
    setSelectedId(id);
  }

  function handleViewOnMap(id: number) {
    setSelectedId(null);
    window.setTimeout(() => setSelectedId(id), 30);
    setSheetOpen(false);
  }

  function handleLocate() {
    if (!("geolocation" in navigator)) {
      setGeo("unsupported");
      return;
    }
    setGeo("locating");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCenter([longitude, latitude]);
        setSelectedId(null);
        setGeo("idle");
        const label = await reverseGeocode(latitude, longitude);
        setLocationLabel(shortLabel(label, "Your location"));
      },
      () => setGeo("denied"),
      { timeout: 8000, maximumAge: 600000 }
    );
  }

  const ctaHref = useMemo(
    () =>
      `/assistant?village=${encodeURIComponent(locationLabel || "Gandipet")}&category=${encodeURIComponent(oppCategory || "Dairy")}`,
    [locationLabel, oppCategory]
  );

  return (
    <div className="mx-page">
      <MapHeader />

      {!online && (
        <div className="mx-offline" role="status">
          {uiText(lang, "OFFLINE_MAP")}
        </div>
      )}
      {source === "demo" && !loading && (
        <div className="mx-banner" role="status">
          <span>
            {uiText(lang, "LIVE_DATA_UNAVAILABLE")}
          </span>
          <button
            type="button"
            className="mx-banner-retry"
            onClick={() => setRefreshKey((k) => k + 1)}
          >
            {uiText(lang, "RETRY_LIVE_DATA")}
          </button>
        </div>
      )}

      <main className="mx-main">
        <div className="mx-mapwrap">
          <ExplorerMap
            center={center}
            radiusKm={radiusKm}
            places={visiblePlaces}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <div className="mx-search-overlay">
            <SearchBar
              onPickLocation={handlePickLocation}
              onPickPlace={handlePickPlace}
              places={visiblePlaces}
            />
            <button
              type="button"
              className="mx-geo"
              onClick={handleLocate}
              disabled={geo === "locating"}
            >
              {geo === "locating" ? uiText(lang, "LOCATING") : uiText(lang, "USE_LOCATION")}
            </button>
            {geo === "denied" && (
              <p className="mx-geo-note" role="status">
                {uiText(lang, "LOCATION_UNAVAILABLE")}
              </p>
            )}
            {geo === "unsupported" && (
              <p className="mx-geo-note" role="status">
                {uiText(lang, "GEO_UNSUPPORTED")}
              </p>
            )}
          </div>
          {selectedPlace && (
            <div className="mx-card-float">
              <PlaceCard
                place={selectedPlace}
                onClose={() => setSelectedId(null)}
                onViewOnMap={handleViewOnMap}
              />
            </div>
          )}
        </div>

        <aside className="mx-side" aria-label={uiText(lang, "AREA_RESULTS")}>
          <p className="mx-exploring">
            {uiText(lang, "EXPLORING")} <strong>{locationLabel}</strong> · {visiblePlaces.length}{" "}
            {visiblePlaces.length === 1 ? uiText(lang, "BUSINESS") : uiText(lang, "BUSINESSES")} {uiText(lang, "IN_VIEW")}
          </p>
          {fundedCount > 0 && (
            <p className="mx-funded-note" role="status">
              {fundedCount} {fundedCount === 1 ? uiText(lang, "FUNDED_BUSINESS") : uiText(lang, "FUNDED_BUSINESSES")} {uiText(lang, "MAP")}
            </p>
          )}
          <RadiusControl radiusKm={radiusKm} onChange={setRadiusKm} />
          <PlacePanel
            places={visiblePlaces}
            activeCat={activeCat}
            setActiveCat={setActiveCat}
            selectedId={selectedId}
            onSelect={setSelectedId}
            source={source}
            loading={loading}
          />
          <IntelPanel places={visiblePlaces} source={source} radiusKm={radiusKm} />
          <OpportunityMode
            places={visiblePlaces}
            radiusKm={radiusKm}
            category={oppCategory}
            onCategoryChange={setOppCategory}
            source={source}
          />
          <Link className="mx-cta" href={ctaHref}>
            {uiText(lang, "ANALYZE_AREA")}
          </Link>
          <p className="mx-cta-note">
            {uiText(lang, "CONTINUES_ASSISTANT", { location: locationLabel, category: categoryText(lang, oppCategory) })}
          </p>
        </aside>
      </main>

      <div className="mx-strip" role="status">
        <span>
          {visiblePlaces.length} {visiblePlaces.length === 1 ? uiText(lang, "BUSINESS") : uiText(lang, "BUSINESSES")} {uiText(lang, "NEARBY")}
        </span>
        <button type="button" onClick={() => setSheetOpen(true)}>
          {uiText(lang, "AREA_RESULTS")}
        </button>
      </div>

      {sheetOpen && (
        <div
          className="mx-scrim"
          onClick={() => setSheetOpen(false)}
          aria-hidden="true"
        />
      )}
      <div
        className="mx-sheet"
        data-open={sheetOpen}
        role="dialog"
        aria-label={uiText(lang, "AREA_RESULTS")}
        aria-hidden={!sheetOpen}
      >
        <button
          type="button"
          className="mx-sheet-close"
          onClick={() => setSheetOpen(false)}
          aria-label={uiText(lang, "CLOSE_RESULTS")}
          tabIndex={sheetOpen ? 0 : -1}
        >
          ×
        </button>
        <p className="mx-exploring">
          {uiText(lang, "EXPLORING")} <strong>{locationLabel}</strong> · {visiblePlaces.length}{" "}
          {visiblePlaces.length === 1 ? uiText(lang, "BUSINESS") : uiText(lang, "BUSINESSES")} {uiText(lang, "IN_VIEW")}
        </p>
        {selectedPlace && (
          <PlaceCard
            place={selectedPlace}
            onClose={() => setSelectedId(null)}
            onViewOnMap={handleViewOnMap}
          />
        )}
        <RadiusControl radiusKm={radiusKm} onChange={setRadiusKm} />
        <PlacePanel
          places={visiblePlaces}
          activeCat={activeCat}
          setActiveCat={setActiveCat}
          selectedId={selectedId}
          onSelect={setSelectedId}
          source={source}
          loading={loading}
        />
        <IntelPanel places={visiblePlaces} source={source} radiusKm={radiusKm} />
        <OpportunityMode
          places={visiblePlaces}
          radiusKm={radiusKm}
          category={oppCategory}
          onCategoryChange={setOppCategory}
          source={source}
        />
        <Link className="mx-cta" href={ctaHref}>
          {uiText(lang, "ANALYZE_AREA")}
        </Link>
        <p className="mx-cta-note">
          {uiText(lang, "CONTINUES_ASSISTANT", { location: locationLabel, category: categoryText(lang, oppCategory) })}
        </p>
      </div>
    </div>
  );
}
