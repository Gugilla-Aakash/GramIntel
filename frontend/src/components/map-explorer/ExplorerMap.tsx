"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MLMap } from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";
import { circlePolygon } from "@/lib/map-data";
import { getCategoryColor, type RealPlace } from "@/lib/places";
import { DefaultPoster } from "../media/VideoBackground";
import { useUiLang } from "@/lib/landing-strings";
import { uiText } from "@/lib/ui-strings";

/* ─── basemap styles (copied cascade pattern from GramIntelMap — own candidates, no shared import) ─── */
const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

const CARTO_API_KEY =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_CARTO_API_KEY as string | undefined)
    : undefined;

function cartoTiles(): string[] {
  const base = [
    "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
    "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
    "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
    "https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
  ];
  if (!CARTO_API_KEY) return base;
  return base.map((u) => `${u}?api_key=${CARTO_API_KEY}`);
}

const CARTO_STYLE: any = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: cartoTiles(),
      tileSize: 256,
      maxzoom: 20,
      attribution: "© CARTO · © OpenStreetMap contributors",
    },
  },
  layers: [{ id: "carto", type: "raster" as const, source: "carto" }],
};

const MAPTILER_KEY =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_MAPTILER_KEY as string | undefined)
    : undefined;

const MAPTILER_STYLE = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/positron/style.json?key=${MAPTILER_KEY}`
  : null;

const CANDIDATES: Array<{ label: string; style: string | any }> = [
  { label: "OpenFreeMap vector", style: OPENFREEMAP_STYLE },
  ...(MAPTILER_STYLE ? [{ label: "MapTiler vector", style: MAPTILER_STYLE }] : []),
  { label: "CARTO raster", style: CARTO_STYLE },
];

export interface ExplorerMapProps {
  center: [number, number];
  radiusKm: number;
  places: RealPlace[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onMoveEnd?: (center: [number, number]) => void;
}

function zoomForRadius(radiusKm: number): number {
  if (radiusKm <= 2) return 14;
  if (radiusKm <= 5) return 13;
  return 12.3;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function placesToGeoJSON(places: RealPlace[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: places.map((p) => ({
      type: "Feature" as const,
      properties: {
        id: p.id,
        name: p.name,
        category: p.category,
        funded: p.source === "gramintel",
        color: p.source === "gramintel" ? "#C8912D" : getCategoryColor(p.category),
      },
      geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
    })),
  };
}

export default function ExplorerMap({
  center,
  radiusKm,
  places,
  selectedId,
  onSelect,
  onMoveEnd,
}: ExplorerMapProps) {
  const lang = useUiLang();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const loadedRef = useRef(false);
  const placesRef = useRef<RealPlace[]>(places);
  placesRef.current = places;
  const onSelectRef = useRef(onSelect);
  const onMoveEndRef = useRef(onMoveEnd);
  onSelectRef.current = onSelect;
  onMoveEndRef.current = onMoveEnd;
  const idleFlushedRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [styleFailed, setStyleFailed] = useState(false);
  const [failReason, setFailReason] = useState("");
  const [attemptLabel, setAttemptLabel] = useState("preparing explorer map");
  const [trace, setTrace] = useState<string[]>([]);

  const note = (s: string) => {
    console.warn(`[GramIntel ExplorerMap] ${s}`);
    setTrace((t) => [...t.slice(-12), s]);
  };

  /* ── init: tile cascade ── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const testCanvas = document.createElement("canvas");
    const gl = testCanvas.getContext("webgl2") || testCanvas.getContext("webgl");
    if (!gl) {
      setFailReason("WebGL is unavailable in this browser");
      setStyleFailed(true);
      return;
    }

    let attempt = 0;
    let disposed = false;
    let watchdog: ReturnType<typeof setTimeout>;
    let map: MLMap | null = null;

    const clearWatch = () => clearTimeout(watchdog);
    const armWatch = () => {
      clearWatch();
      watchdog = setTimeout(() => {
        if (!loadedRef.current && !disposed) {
          note(`${CANDIDATES[attempt].label} — timed out after 10s`);
          advance();
        }
      }, 10000);
    };

    const teardown = () => {
      try {
        map?.remove();
      } catch {
        /* noop */
      }
      map = null;
      mapRef.current = null;
      loadedRef.current = false;
      setReady(false);
    };

    const advance = (reason?: string) => {
      if (reason) note(`${CANDIDATES[attempt]?.label} — FAILED: ${reason}`);
      attempt += 1;
      if (attempt >= CANDIDATES.length) {
        setFailReason(reason ?? "every basemap provider was unreachable from this network");
        teardown();
        setStyleFailed(true);
        return;
      }
      note(`switching to fallback: ${CANDIDATES[attempt].label}`);
      setAttemptLabel(CANDIDATES[attempt].label.toLowerCase());
      teardown();
      boot(attempt);
    };

    const addLayers = (m: MLMap) => {
      // center pin
      m.addSource("mx-center-src", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: center },
        } as GeoJSON.Feature<GeoJSON.Point>,
      });
      m.addLayer({
        id: "mx-center",
        type: "circle",
        source: "mx-center-src",
        paint: {
          "circle-radius": 7,
          "circle-color": "#071A14",
          "circle-stroke-color": "#C8912D",
          "circle-stroke-width": 1.5,
        },
      });

      // exploration radius ring
      m.addSource("mx-radius-src", {
        type: "geojson",
        data: circlePolygon(center, radiusKm) as GeoJSON.Feature<GeoJSON.Polygon>,
      });
      m.addLayer({
        id: "mx-radius-fill",
        type: "fill",
        source: "mx-radius-src",
        paint: { "fill-color": "#0B5D3B", "fill-opacity": 0.08 },
      });
      m.addLayer({
        id: "mx-radius-line",
        type: "line",
        source: "mx-radius-src",
        paint: { "line-color": "#C8912D", "line-width": 1.5, "line-dasharray": [5, 4] },
      });

      // business points (unclustered: every business paints individually)
      m.addSource("mx-places", {
        type: "geojson",
        data: placesToGeoJSON(placesRef.current),
      });
      m.addLayer({
        id: "mx-points",
        type: "circle",
        source: "mx-places",
        filter: ["!=", ["get", "funded"], true],
        paint: {
          "circle-radius": 6,
          "circle-color": ["get", "color"],
          "circle-stroke-color": "#FCFBF7",
          "circle-stroke-width": 1.5,
        },
      });
      // GramIntel-funded businesses: larger gold markers above the rest
      m.addLayer({
        id: "mx-funded",
        type: "circle",
        source: "mx-places",
        filter: ["==", ["get", "funded"], true],
        paint: {
          "circle-radius": 9,
          "circle-color": "#C8912D",
          "circle-stroke-color": "#071A14",
          "circle-stroke-width": 2,
        },
      });
      // selected ring
      m.addLayer({
        id: "mx-selected",
        type: "circle",
        source: "mx-places",
        filter: ["==", ["get", "id"], -1],
        paint: {
          "circle-radius": 11,
          "circle-color": "rgba(0,0,0,0)",
          "circle-stroke-color": "#C8912D",
          "circle-stroke-width": 2.5,
        },
      });
    };

    const wireInteractions = (m: MLMap) => {
      const pickFeature = (e: any) => {
        const f = e?.features?.[0];
        const id = f?.properties?.id;
        if (typeof id !== "number") return;
        onSelectRef.current(id);
      };
      m.on("click", "mx-points", pickFeature);
      m.on("click", "mx-funded", pickFeature);
      m.on("click", (e: any) => {
        const hits = m.queryRenderedFeatures(e.point, { layers: ["mx-points", "mx-funded"] });
        if (hits.length === 0) onSelectRef.current(null);
      });
      m.on("mouseenter", "mx-points", () => {
        m.getCanvas().style.cursor = "pointer";
      });
      m.on("mouseleave", "mx-points", () => {
        m.getCanvas().style.cursor = "";
      });
      m.on("mouseenter", "mx-funded", () => {
        m.getCanvas().style.cursor = "pointer";
      });
      m.on("mouseleave", "mx-funded", () => {
        m.getCanvas().style.cursor = "";
      });
      m.on("moveend", () => {
        const c = m.getCenter();
        onMoveEndRef.current?.([c.lng, c.lat]);
      });
    };

    const boot = (idx: number) => {
      const cand = CANDIDATES[idx];
      note(`trying basemap: ${cand.label}`);
      armWatch();
      try {
        map = new maplibregl.Map({
          container,
          style: cand.style,
          center,
          zoom: zoomForRadius(radiusKm),
          attributionControl: false,
          dragRotate: false,
          pitchWithRotate: false,
          maxPitch: 0,
          cooperativeGestures: false,
          interactive: true,
        });
      } catch (err: any) {
        advance(`context failure (${String(err?.message ?? err).slice(0, 80)})`);
        return;
      }
      mapRef.current = map;

      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }),
        "top-right"
      );
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
      map.touchZoomRotate.disableRotation();

      map.on("error", (e: any) => {
        const url = String(e?.error?.url ?? "");
        const st = e?.error?.status;
        const msg = String(e?.error?.message ?? e?.message ?? "unknown");
        console.error(
          `[GramIntel ExplorerMap] error: ${msg}${url ? ` · url=${url.slice(0, 90)}` : ""}${st ? ` · status=${st}` : ""}`
        );
        if (
          !loadedRef.current &&
          (url.includes("/styles/") ||
            url.includes("style.json") ||
            (typeof st === "number" && st >= 400 && url))
        ) {
          advance(`style request failed (${st ?? "network"} · ${url.slice(0, 70)})`);
        }
      });

      map.on("load", () => {
        if (disposed || loadedRef.current || !map) return;
        clearWatch();
        const liveMap: MLMap = map;
        try {
          addLayers(liveMap);
          wireInteractions(liveMap);
          const src = liveMap.getSource("mx-places") as maplibregl.GeoJSONSource | undefined;
          try {
            src?.setData(placesToGeoJSON(placesRef.current));
          } catch {
            /* flushed again on idle */
          }
          liveMap.once("idle", () => {
            if (disposed || idleFlushedRef.current) return;
            idleFlushedRef.current = true;
            try {
              const s = liveMap.getSource("mx-places") as maplibregl.GeoJSONSource | undefined;
              s?.setData(placesToGeoJSON(placesRef.current));
            } catch {
              /* best effort */
            }
          });
        } catch (err) {
          note(`partial layer setup issue: ${String(err).slice(0, 90)}`);
        }
        loadedRef.current = true;
        setReady(true);
        note(`map ready via ${cand.label}`);
      });
    };

    boot(0);
    return () => {
      disposed = true;
      clearWatch();
      teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* keep latest places for the boot closure (declared with the other refs above) */

  /* ── props-driven camera: center ── */
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !loadedRef.current) return;
    const cur = m.getCenter();
    if (Math.abs(cur.lng - center[0]) < 1e-6 && Math.abs(cur.lat - center[1]) < 1e-6) return;
    if (prefersReducedMotion()) m.jumpTo({ center });
    else m.easeTo({ center, duration: 900 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center, ready]);

  /* ── radius ring + zoom ── */
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !loadedRef.current) return;
    const src = m.getSource("mx-radius-src") as maplibregl.GeoJSONSource | undefined;
    try {
      src?.setData(circlePolygon(center, radiusKm) as GeoJSON.Feature<GeoJSON.Polygon>);
    } catch {
      /* source not ready yet */
    }
    const csrc = m.getSource("mx-center-src") as maplibregl.GeoJSONSource | undefined;
    try {
      csrc?.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "Point", coordinates: center },
      } as GeoJSON.Feature<GeoJSON.Point>);
    } catch {
      /* source not ready yet */
    }
    const z = zoomForRadius(radiusKm);
    if (Math.abs(m.getZoom() - z) > 0.25) {
      if (prefersReducedMotion()) m.jumpTo({ center, zoom: z });
      else m.easeTo({ center, zoom: z, duration: 900 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusKm, center, ready]);

  /* ── places data ── */
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !loadedRef.current) return;
    const src = m.getSource("mx-places") as maplibregl.GeoJSONSource | undefined;
    try {
      src?.setData(placesToGeoJSON(places));
    } catch {
      /* source not ready yet */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, ready]);

  /* ── selection: ring + flyTo ── */
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !loadedRef.current) return;
    try {
      m.setFilter("mx-selected", ["==", ["get", "id"], selectedId ?? -1]);
    } catch {
      /* layer not ready yet */
    }
    if (selectedId == null) return;
    const p = places.find((x) => x.id === selectedId);
    if (!p) return;
    const target: [number, number] = [p.lng, p.lat];
    if (prefersReducedMotion()) m.jumpTo({ center: target, zoom: Math.max(m.getZoom(), 14) });
    else m.flyTo({ center: target, zoom: Math.max(m.getZoom(), 14), duration: 900 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, places, ready]);

  /* ── error state ── */
  if (styleFailed) {
    return (
      <div className="mx-map" style={{ position: "relative", overflow: "hidden" }}>
        <DefaultPoster />
        <div
          style={{
            position: "absolute",
            bottom: 18,
            left: 18,
            right: 18,
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 16px",
            alignItems: "center",
          }}
        >
          <span
            className="body-ui"
            style={{
              fontSize: 9,
              letterSpacing: ".22em",
              color: "rgba(237,234,223,.6)",
              background: "rgba(7,26,20,.65)",
              padding: "7px 12px",
              borderRadius: 999,
            }}
          >
            INTERACTIVE MAP OFFLINE · EXPLORER UNAVAILABLE
          </span>
          <span
            className="body-ui"
            title={failReason}
            style={{ fontSize: 8.5, letterSpacing: ".14em", color: "rgba(237,234,223,.4)" }}
          >
            REASON: {failReason.toUpperCase()}
          </span>
        </div>
        <div
          className="mono-num"
          style={{
            position: "absolute",
            top: 18,
            left: 18,
            fontSize: 9,
            lineHeight: 1.9,
            letterSpacing: ".06em",
            color: "rgba(237,234,223,.5)",
            background: "rgba(7,26,20,.55)",
            padding: "10px 14px",
            borderRadius: 10,
            maxWidth: 420,
          }}
        >
          {trace.map((t, i) => (
            <div key={i}>› {t}</div>
          ))}
        </div>
      </div>
    );
  }

  /* ── normal render ── */
  return (
    <div className="gi-map mx-map" style={{ position: "relative" }}>
      <div ref={containerRef} className="mx-map-canvas" style={{ position: "absolute", inset: 0 }} />
      {!ready && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "#f8f9fa",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
        <span
          className="body-ui"
          style={{
            fontSize: 10,
            letterSpacing: ".2em",
            color: "#5f6368",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              border: "2px solid #dadce0",
              borderTopColor: "#1a73e8",
              borderRadius: 999,
              display: "inline-block",
              animation: "spin 0.9s linear infinite",
            }}
          />
          {uiText(lang, "LOADING_MAP")}
        </span>
        </div>
      )}
    </div>
  );
}
