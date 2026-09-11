"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MLMap, FlyToOptions } from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";
import { demoData } from "@/lib/demo-data";
import {
  buildCompetitors,
  buildConsumers,
  buildSuppliers,
  buildTransportRoutes,
  buildOpportunityRegion,
  circlePolygon,
  CATEGORY_COLORS,
} from "@/lib/map-data";
import {
  fetchRealPlaces,
  fetchPlacesNear,
  getCategoryColor,
  getCategoryLabel,
  type PlaceCategory,
  type RealPlace,
} from "@/lib/places";
import { MAP_STORY, cameraForProgressQuick } from "@/lib/map/map-story";
import { useIsTouch } from "../../lib/hooks";
import { DefaultPoster } from "../media/VideoBackground";
import { useUiLang } from "@/lib/landing-strings";
import { uiText } from "@/lib/ui-strings";
import { localizeMapStory } from "@/lib/map/map-story-strings";

/* ─── basemap styles ─── */
/* OpenFreeMap Positron: light, clean Google-Maps-like style.
   Free, keyless vector basemap from OSM — perfect for hackathon. */
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

/* CARTO raster: global CDN, always reachable — now requires api_key from carto.com/basemaps.
   Used as fallback only if the vector style fails. */
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

/* ─── Gandipet, Hyderabad, Telangana ─── */
const CENTER: [number, number] = demoData.location.coords; // [78.3222, 17.3835]

export type Chapter = 0 | 1 | 2 | 3 | 4;

const CHAPTER_CAM: Record<Chapter, Omit<FlyToOptions, "essential">> = {
  0: { center: CENTER, zoom: 13, pitch: 0, bearing: 0, duration: 2200 },
  1: { center: CENTER, zoom: 11.8, pitch: 8, bearing: 0, duration: 2200 },
  2: { center: CENTER, zoom: 12.5, pitch: 34, bearing: -16, duration: 2400 },
  3: {
    center: [CENTER[0] - 0.028, CENTER[1] - 0.022],
    zoom: 13.5,
    pitch: 44,
    bearing: 22,
    duration: 2400,
  },
  4: { center: CENTER, zoom: 11, pitch: 0, bearing: 0, duration: 2600 },
};

function vis(map: MLMap, layer: string, visible: boolean) {
  try {
    if (map.getLayer(layer)) {
      map.setLayoutProperty(layer, "visibility", visible ? "visible" : "none");
    }
  } catch {
    /* layer not ready yet */
  }
}

/**
 * Real-map intelligence canvas for Gandipet, Hyderabad.
 * Chapters drive camera + layer choreography;
 * the map stays fully interactive (pan / zoom / tap markers).
 */
export default function GramIntelMap({
  chapter = 0,
  progress,
  onReady,
}: {
  chapter?: Chapter;
  progress?: number; // 0→1 scrubbed progress for 5-stage journey — when provided, drives camera + layers
  onReady?: () => void;
}) {
  const lang = useUiLang();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const mainPinRef = useRef<maplibregl.Marker | null>(null);
  const loadedRef = useRef(false);
  const isTouch = useIsTouch();
  const [ready, setReady] = useState(false);
  const [styleFailed, setStyleFailed] = useState(false);
  const [failReason, setFailReason] = useState("");
  const [attemptLabel, setAttemptLabel] = useState("preparing survey map");
  const [trace, setTrace] = useState<string[]>([]);
  const scanRaf = useRef(0);
  const dashTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [activeFilter, setActiveFilter] = useState<PlaceCategory>("all");
  const [realPlacesCount, setRealPlacesCount] = useState(0);
  const [mapInteractive, setMapInteractive] = useState(true);
  const placesRef = useRef<RealPlace[]>([]);

  const note = (s: string) => {
    console.warn(`[GramIntel] ${s}`);
    setTrace((t) => [...t.slice(-12), s]);
  };

  /* click-to-interact: enable map wheel/drag only when user explicitly clicks */
  const activateMap = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.scrollZoom.enable();
    map.dragPan.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
    map.doubleClickZoom.enable();
    map.touchZoomRotate.enable();
    // keep rotation disabled — only zoom
    map.touchZoomRotate.disableRotation();
    setMapInteractive(true);
  }, []);

  const deactivateMap = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.scrollZoom.disable();
    map.dragPan.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    map.doubleClickZoom.disable();
    map.touchZoomRotate.disable();
    setMapInteractive(false);
  }, []);

  /* ── init ── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /* WebGL check */
    const testCanvas = document.createElement("canvas");
    const gl =
      testCanvas.getContext("webgl2") || testCanvas.getContext("webgl");
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
      if (dashTimer.current) {
        clearInterval(dashTimer.current);
        dashTimer.current = null;
      }
      if (scanRaf.current) cancelAnimationFrame(scanRaf.current);
      scanRaf.current = 0;
      try { map?.remove(); } catch { /* noop */ }
      map = null;
      mapRef.current = null;
      setReady(false);
    };

    const advance = (reason?: string) => {
      if (reason) note(`${CANDIDATES[attempt]?.label} — FAILED: ${reason}`);
      attempt += 1;
      if (attempt >= CANDIDATES.length) {
        setFailReason(
          reason ?? "every basemap provider was unreachable from this network"
        );
        teardown();
        setStyleFailed(true);
        return;
      }
      note(`switching to fallback: ${CANDIDATES[attempt].label}`);
      setAttemptLabel(CANDIDATES[attempt].label.toLowerCase());
      teardown();
      boot(attempt);
    };

    const boot = (idx: number) => {
      const cand = CANDIDATES[idx];
      note(`trying basemap: ${cand.label}`);
      armWatch();
      try {
      map = new maplibregl.Map({
        container,
        style: cand.style,
        center: CENTER,
        zoom: 12.5,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        maxPitch: 60,
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
      map.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        "bottom-right"
      );
      map.touchZoomRotate.disableRotation();

      map.on("error", (e: any) => {
        const url = String(e?.error?.url ?? "");
        const st = e?.error?.status;
        const msg = String(e?.error?.message ?? e?.message ?? "unknown");
        console.error(`[GramIntel Map] error: ${msg}${url ? ` · url=${url.slice(0, 90)}` : ""}${st ? ` · status=${st}` : ""}`);
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
        try {
          addLayers(map);
          wireInteractions(map);
        } catch (err) {
          note(`partial layer setup issue: ${String(err).slice(0, 90)}`);
        }
        loadedRef.current = true;
        note(`map ready via ${cand.label}`);

        /* Reset-to-Gandipet button */
        const resetBtn = document.createElement("button");
        resetBtn.className = "gi-reset-btn";
        resetBtn.type = "button";
        resetBtn.setAttribute("aria-label", "Reset to Gandipet");
        resetBtn.title = "Reset to Gandipet (demo location)";
        resetBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg>`;
        resetBtn.addEventListener("click", () => {
          map!.flyTo({ ...CHAPTER_CAM[0], essential: true });
        });
        const ctrl = document.createElement("div");
        ctrl.className = "maplibregl-ctrl maplibregl-ctrl-group gi-reset-ctrl";
        ctrl.appendChild(resetBtn);
        (map as any)._controlContainer.appendChild(ctrl);

        setReady(true);
        onReady?.();

        /* fetch real places from Overpass API (non-blocking) */
        fetchRealPlaces().then((places) => {
          if (disposed || !map) return;
          placesRef.current = places;
          setRealPlacesCount(places.length);
          addRealPlacesLayer(map, places);
        });
        // preload Warangal/Nizamabad/Karimnagar/Khammam in background for instant quick transitions
        MAP_STORY.slice(1).forEach((loc) => {
          fetchPlacesNear(loc.lat, loc.lng, 8000).catch(() => {});
        });
      });
    };

    setAttemptLabel(CANDIDATES[0].label.toLowerCase());
    boot(0);

    return () => {
      disposed = true;
      clearWatch();
      teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ctrl+scroll to zoom — keeps page butter-smooth, tip outside
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.scrollZoom.disable();
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) map.scrollZoom.enable();
      else map.scrollZoom.disable();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    window.addEventListener("blur", onKey as any);
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) map.scrollZoom.enable();
    };
    window.addEventListener("wheel", onWheel, { passive: true } as any);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      window.removeEventListener("blur", onKey as any);
      window.removeEventListener("wheel", onWheel as any);
      try { map.scrollZoom.disable(); } catch {}
    };
  }, [ready]);

  /* ── chapter choreography — layers only, no camera movement ──
     When progress is provided (new 5-stage journey), this legacy
     chapter-driven effect is skipped — the progress effect below
     handles both camera and layers. */
  useEffect(() => {
    if (progress !== undefined) return;
    const map = mapRef.current;
    if (!map || !ready) return;

    /* reset all */
    const layersOff = [
      "gi-radius5-fill", "gi-radius5-line",
      "gi-radius10-fill", "gi-radius10-line",
      "gi-consumers",
      "gi-clusters", "gi-cluster-count", "gi-business-points", "gi-business-halo",
      "gi-suppliers",
      "gi-routes-casing", "gi-routes",
      "gi-opportunity-fill", "gi-opportunity-line",
    ];
    layersOff.forEach((l) => vis(map, l, false));
    stopScan();

    const t: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => t.push(setTimeout(fn, ms));

    if (chapter === 1) {
      later(() => {
        vis(map, "gi-radius5-fill", true);
        vis(map, "gi-radius5-line", true);
      }, 500);
      later(() => {
        vis(map, "gi-radius10-fill", true);
        vis(map, "gi-radius10-line", true);
        vis(map, "gi-radius5-fill", false);
        vis(map, "gi-radius5-line", false);
        vis(map, "gi-consumers", true);
      }, 1500);
    }

    if (chapter === 2) {
      later(() => {
        ["gi-clusters", "gi-cluster-count", "gi-business-points", "gi-business-halo"].forEach((l) => vis(map, l, true));
        vis(map, "gi-suppliers", true);
        vis(map, "gi-routes-casing", true);
        vis(map, "gi-routes", true);
        startDashFlow();
      }, 400);
    }

    if (chapter === 3) {
      later(() => startScan(), 350);
      later(() => {
        vis(map, "gi-opportunity-fill", true);
        vis(map, "gi-opportunity-line", true);
      }, 2100);
    }

    if (chapter === 4) {
      later(() => {
        ["gi-radius10-fill", "gi-radius10-line", "gi-consumers", "gi-clusters", "gi-cluster-count", "gi-business-points", "gi-opportunity-fill", "gi-opportunity-line", "gi-suppliers"].forEach((l) => vis(map, l, true));
        startDashFlow();
      }, 600);
    }

    function stopScan() {
      if (scanRaf.current) cancelAnimationFrame(scanRaf.current);
      scanRaf.current = 0;
      vis(map!, "gi-scan-band", false);
    }

    function startScan() {
      const m = map!;
      if (!m.getSource("gi-scan")) return;
      const t0 = performance.now();
      const DUR = 1700;
      vis(m, "gi-scan-band", true);
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / DUR);
        const lat = CENTER[1] + 0.115 - p * 0.23;
        const dLng = 0.125;
        (m.getSource("gi-scan") as any).setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Polygon",
                coordinates: [[
                  [CENTER[0] - dLng, lat - 0.022],
                  [CENTER[0] + dLng, lat - 0.022],
                  [CENTER[0] + dLng, lat + 0.022],
                  [CENTER[0] - dLng, lat + 0.022],
                  [CENTER[0] - dLng, lat - 0.09],
                ]],
              },
            },
          ],
        });
        m.setPaintProperty("gi-scan-band", "fill-opacity", 0.28 * Math.sin(p * Math.PI));
        if (p < 1) scanRaf.current = requestAnimationFrame(step);
        else vis(m, "gi-scan-band", false);
      };
      scanRaf.current = requestAnimationFrame(step);
    }

    function startDashFlow() {
      if (dashTimer.current) clearInterval(dashTimer.current);
      const dashes: number[][] = [
        [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5], [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0], [0, 0.5, 3, 3.5],
      ];
      let i = 0;
      dashTimer.current = setInterval(() => {
        i = (i + 1) % dashes.length;
        try {
          mapRef.current?.setPaintProperty("gi-routes", "line-dasharray", dashes[i]);
        } catch { /* noop */ }
      }, 90);
    }

    return () => {
      t.forEach(clearTimeout);
    };
  }, [chapter, ready]);

  /* ── 5-stage scrubbed journey — camera + per-location intelligence ──
     When `progress` (0→1) is provided, this drives the map.
     Camera is interpolated and applied via jumpTo (no flyTo per tick).
     Real places are fetched per stage and source is updated.
     Layers are toggled based on derived stage. */
  const lastStageRef = useRef<number>(-1);
  useEffect(() => {
    if (progress === undefined) return;
    const map = mapRef.current;
    if (!map || !ready) return;

    // — cinematic butter-smooth — adapts to scroll velocity (futuristic)
    const cam = cameraForProgressQuick(progress);
    try {
      const last = (map as any).__lastProgress ?? progress;
      const delta = Math.abs(progress - last);
      (map as any).__lastProgress = progress;
      const duration = Math.max(320, Math.min(900, 380 + delta * 2200));
      map.easeTo({
        center: [cam.lng, cam.lat],
        zoom: cam.zoom,
        pitch: cam.pitch,
        bearing: cam.bearing,
        duration,
        easing: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
      });
    } catch {
      try {
        map.jumpTo({ center: [cam.lng, cam.lat], zoom: cam.zoom, pitch: cam.pitch, bearing: cam.bearing });
      } catch {}
    }

    // — stage-driven layers —
    const stage = cam.stage;
    // reset
    const allLayers = [
      "gi-radius5-fill", "gi-radius5-line",
      "gi-radius10-fill", "gi-radius10-line",
      "gi-consumers",
      "gi-clusters", "gi-cluster-count", "gi-business-points", "gi-business-halo",
      "gi-suppliers",
      "gi-routes-casing", "gi-routes",
      "gi-opportunity-fill", "gi-opportunity-line",
    ];
    // during travel (localT 0.35–0.65), keep only context layers; settle shows intelligence
    const settling = cam.localT < 0.35 || cam.localT > 0.65 ? false : true;
    // simple: show layers based on stage, hide during mid-travel for clean motion
    if (!settling && stage < 4) {
      // mid-travel: minimal — just keep radii faded
      allLayers.forEach((l) => vis(map, l, false));
      if (stage === 0) {
        vis(map, "gi-radius5-fill", true);
        vis(map, "gi-radius5-line", true);
      }
      return;
    }

    allLayers.forEach((l) => vis(map, l, false));
    if (stage === 0) {
      vis(map, "gi-radius5-fill", true);
      vis(map, "gi-radius5-line", true);
      vis(map, "gi-consumers", true);
    } else if (stage === 1) {
      vis(map, "gi-radius10-fill", true);
      vis(map, "gi-radius10-line", true);
      vis(map, "gi-consumers", true);
      ["gi-clusters", "gi-cluster-count", "gi-business-points", "gi-business-halo"].forEach((l) => vis(map, l, true));
    } else if (stage === 2) {
      ["gi-clusters", "gi-cluster-count", "gi-business-points", "gi-business-halo"].forEach((l) => vis(map, l, true));
      vis(map, "gi-suppliers", true);
      vis(map, "gi-routes-casing", true);
      vis(map, "gi-routes", true);
    } else if (stage === 3) {
      ["gi-clusters", "gi-cluster-count", "gi-business-points", "gi-business-halo"].forEach((l) => vis(map, l, true));
      vis(map, "gi-suppliers", true);
      vis(map, "gi-opportunity-fill", true);
      vis(map, "gi-opportunity-line", true);
    } else if (stage === 4) {
      ["gi-radius10-fill", "gi-radius10-line", "gi-consumers", "gi-clusters", "gi-cluster-count", "gi-business-points", "gi-opportunity-fill", "gi-opportunity-line", "gi-suppliers"].forEach((l) => vis(map, l, true));
    }

    // — per-location real places (fetch once per stage) —
    if (stage !== lastStageRef.current) {
      lastStageRef.current = stage;
      const loc = MAP_STORY[stage];
      fetchPlacesNear(loc.lat, loc.lng, 8000).then((places) => {
        const m = mapRef.current;
        if (!m || !m.getSource("gi-real-places")) return;
        (m.getSource("gi-real-places") as any).setData({
          type: "FeatureCollection",
          features: places.map((p) => ({
            type: "Feature" as const,
            properties: {
              name: p.name,
              category: p.category,
              distanceKm: p.distanceKm,
              amenity: p.amenity || "",
              shop: p.shop || "",
            },
            geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
          })),
        });
        // reset filter to show all for new location
        applyFilter(m, activeFilter);
      });

      // update main pin to current location
      mainPinRef.current?.setLngLat([loc.lng, loc.lat]);
      const markerEl = document.querySelector(".gi-pin-label") as HTMLElement | null;
      if (markerEl) {
        markerEl.textContent = `${loc.name.toUpperCase()} · ${stage === 0 ? "DEMO" : "STAGE " + (stage + 1)}`;
      }
      // update radius circles to current center
      const src5 = map.getSource("gi-radius5") as any;
      const src10 = map.getSource("gi-radius10") as any;
      if (src5) src5.setData(circlePolygon([loc.lng, loc.lat], 5));
      if (src10) src10.setData(circlePolygon([loc.lng, loc.lat], 10));
    }
  }, [progress, ready, activeFilter]);
  function addLayers(map: MLMap) {
    /* 5 km and 10 km market radii — real GeoJSON polygons around Gandipet */
    map.addSource("gi-radius5", {
      type: "geojson",
      data: circlePolygon(CENTER, 5),
    });
    map.addSource("gi-radius10", {
      type: "geojson",
      data: circlePolygon(CENTER, 10),
    });
    const ringFill = (id: string, color: string, op: number) =>
      map.addLayer({
        id: `${id}-fill`,
        type: "fill",
        source: id,
        paint: { "fill-color": color, "fill-opacity": op },
        layout: { visibility: "none" },
      });
    const ringLine = (id: string, color: string, width: number) =>
      map.addLayer({
        id: `${id}-line`,
        type: "line",
        source: id,
        paint: { "line-color": color, "line-width": width },
        layout: { visibility: "none" },
      });
    ringFill("gi-radius5", "#A9C3AE", 0.05);
    ringLine("gi-radius5", "#A9C3AE", 1.4);
    ringFill("gi-radius10", "#A9C3AE", 0.06);
    ringLine("gi-radius10", "#A9C3AE", 1.8);

    /* consumer density */
    map.addSource("gi-consumers-src", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: buildConsumers().map((c) => ({
          type: "Feature" as const,
          properties: {},
          geometry: { type: "Point" as const, coordinates: c.location },
        })),
      },
    });
    map.addLayer({
      id: "gi-consumers",
      type: "circle",
      source: "gi-consumers-src",
      paint: {
        "circle-color": "#A9C3AE",
        "circle-opacity": 0.32,
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 2.4, 14, 4.5],
        "circle-stroke-width": 0,
      },
      layout: { visibility: "none" },
    });

    /* businesses (clustered, category-coloured) */
    map.addSource("gi-businesses-src", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: buildCompetitors().map((b) => ({
          type: "Feature" as const,
          properties: {
            name: b.name,
            category: b.category ?? "Retail",
            distanceKm: b.distanceKm ?? 0,
            status: b.status,
          },
          geometry: { type: "Point" as const, coordinates: b.location },
        })),
        cluster: true,
        clusterRadius: 52,
      } as any,
    });
    map.addLayer({
      id: "gi-clusters",
      type: "circle",
      source: "gi-businesses-src",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#071A14",
        "circle-opacity": 0.88,
        "circle-stroke-color": "#E3B75B",
        "circle-stroke-width": 1.4,
        "circle-radius": ["step", ["get", "point_count"], 15, 5, 19, 10, 23],
      },
      layout: { visibility: "none" },
    });
    if (map.getStyle()?.glyphs) {
      map.addLayer({
        id: "gi-cluster-count",
        type: "symbol",
        source: "gi-businesses-src",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 11,
          "text-font": ["Noto Sans Regular"],
        },
        paint: { "text-color": "#F3EFE2" },
      });
    }
    map.addLayer(
      {
        id: "gi-business-halo",
        type: "circle",
        source: "gi-businesses-src",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 13,
          "circle-color": ["match", ["get", "category"], ...Object.entries(CATEGORY_COLORS).flat(), "#A9C3AE"] as any,
          "circle-opacity": 0.16,
        },
        layout: { visibility: "none" },
      }
    );
    map.addLayer(
      {
        id: "gi-business-points",
        type: "circle",
        source: "gi-businesses-src",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 6,
          "circle-color": ["match", ["get", "category"], ...Object.entries(CATEGORY_COLORS).flat(), "#A9C3AE"] as any,
          "circle-stroke-color": "#071A14",
          "circle-stroke-width": 1.6,
        },
        layout: { visibility: "none" },
      }
    );

    /* suppliers */
    map.addSource("gi-suppliers-src", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: buildSuppliers().map((s) => ({
          type: "Feature" as const,
          properties: { name: s.name, distanceKm: s.distanceKm ?? 0, status: s.status },
          geometry: { type: "Point" as const, coordinates: s.location },
        })),
      },
    });
    map.addLayer({
      id: "gi-suppliers",
      type: "circle",
      source: "gi-suppliers-src",
      paint: {
        "circle-radius": 6.5,
        "circle-color": "#071A14",
        "circle-stroke-color": "#7FA98F",
        "circle-stroke-width": 2.2,
      },
      layout: { visibility: "none" },
    });

    /* transport routes */
    map.addSource("gi-routes-src", { type: "geojson", data: buildTransportRoutes() });
    map.addLayer({
      id: "gi-routes-casing",
      type: "line",
      source: "gi-routes-src",
      paint: { "line-color": "rgba(7,26,20,.5)", "line-width": 5 },
      layout: { visibility: "none", "line-cap": "round" },
    });
    map.addLayer({
      id: "gi-routes",
      type: "line",
      source: "gi-routes-src",
      paint: {
        "line-color": "#D9C48A",
        "line-width": 2,
        "line-dasharray": [0, 4, 3],
      },
      layout: { visibility: "none", "line-cap": "round" },
    });

    /* Telangana journey — on map instead of separate bar */
    map.addSource("gi-journey-route", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString" as const,
              coordinates: MAP_STORY.map((l) => [l.lng, l.lat] as [number, number]),
            },
          },
        ],
      },
    });
    map.addLayer({
      id: "gi-journey-route",
      type: "line",
      source: "gi-journey-route",
      paint: {
        "line-color": "#1a73e8",
        "line-width": 2.5,
        "line-opacity": 0.38,
        "line-dasharray": [3, 7],
      },
      layout: { visibility: "visible", "line-cap": "round", "line-join": "round" },
    });
    map.addSource("gi-journey-dots", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: MAP_STORY.map((l) => ({
          type: "Feature" as const,
          properties: { name: l.name },
          geometry: { type: "Point" as const, coordinates: [l.lng, l.lat] },
        })),
      },
    });
    map.addLayer({
      id: "gi-journey-dots",
      type: "circle",
      source: "gi-journey-dots",
      paint: {
        "circle-radius": 4.5,
        "circle-color": "#1a73e8",
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 2,
        "circle-opacity": 0.92,
      },
      layout: { visibility: "visible" },
    });

    /* opportunity region */
    map.addSource("gi-opportunity-src", {
      type: "geojson",
      data: buildOpportunityRegion(),
    });
    map.addLayer({
      id: "gi-opportunity-fill",
      type: "fill",
      source: "gi-opportunity-src",
      paint: { "fill-color": "#C8912D", "fill-opacity": 0.17 },
      layout: { visibility: "none" },
    });
    map.addLayer({
      id: "gi-opportunity-line",
      type: "line",
      source: "gi-opportunity-src",
      paint: { "line-color": "#E3B75B", "line-width": 2.2 },
      layout: { visibility: "none" },
    });

    /* scan band */
    map.addSource("gi-scan", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
    map.addLayer({
      id: "gi-scan-band",
      type: "fill",
      source: "gi-scan",
      paint: { "fill-color": "#E3B75B", "fill-opacity": 0 },
      layout: { visibility: "none" },
    });

    /* Gandipet marker — premium pin positioned at exact coordinates */
    const el = document.createElement("div");
    el.className = "gi-pin";
    el.innerHTML = `<span class="gi-pin-dot"></span><span class="gi-pin-label">GANDIPET · DEMO</span>`;
    const pin = new maplibregl.Marker({ element: el, anchor: "center" })
      .setLngLat(CENTER)
      .addTo(map);
    mainPinRef.current = pin;
  }

  /* ── real places from OSM ── */
  function addRealPlacesLayer(map: MLMap, places: RealPlace[]) {
    if (!places.length) return;

    map.addSource("gi-real-places", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: places.map((p) => ({
          type: "Feature" as const,
          properties: {
            name: p.name,
            category: p.category,
            distanceKm: p.distanceKm,
            amenity: p.amenity || "",
            shop: p.shop || "",
          },
          geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
        })),
      },
    });

    map.addLayer({
      id: "gi-real-places-halo",
      type: "circle",
      source: "gi-real-places",
      paint: {
        "circle-radius": 10,
        "circle-color": getCategoryColor("all"),
        "circle-opacity": 0.12,
      },
      layout: { visibility: "visible" },
    });

    map.addLayer({
      id: "gi-real-places-points",
      type: "circle",
      source: "gi-real-places",
      paint: {
        "circle-radius": [
          "match", ["get", "category"],
          "landmark", 7.5,
          "market", 7,
          "food", 5.5,
          "healthcare", 5.5,
          "education", 5,
          "finance", 5,
          "transport", 5,
          "retail", 4.5,
          4,
        ],
        "circle-color": [
          "match", ["get", "category"],
          "landmark", getCategoryColor("landmark"),
          "market", getCategoryColor("market"),
          "food", getCategoryColor("food"),
          "healthcare", getCategoryColor("healthcare"),
          "education", getCategoryColor("education"),
          "finance", getCategoryColor("finance"),
          "transport", getCategoryColor("transport"),
          "retail", getCategoryColor("retail"),
          "landmark", getCategoryColor("landmark"),
          getCategoryColor("business"),
        ],
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 1.8,
      },
      layout: { visibility: "visible" },
    });

    /* place name labels — visible at zoom >= 14 */
    map.addLayer({
      id: "gi-real-places-labels",
      type: "symbol",
      source: "gi-real-places",
      minzoom: 14,
      layout: {
        "text-field": ["get", "name"],
        "text-size": 10,
        "text-font": ["Noto Sans Regular"],
        "text-anchor": "top",
        "text-offset": [0, 1.2],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        visibility: "visible",
      },
      paint: {
        "text-color": "#F3EFE2",
        "text-halo-color": "#071A14",
        "text-halo-width": 1.5,
        "text-halo-blur": 0.5,
      },
    });

    /* category filter interaction */
    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: true,
      offset: 12,
      className: "gi-popup",
      maxWidth: "240px",
    });

    map.on("mouseenter", "gi-real-places-points", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "gi-real-places-points", () => {
      map.getCanvas().style.cursor = "";
      popup.remove();
    });
    map.on("click", "gi-real-places-points", (e: any) => {
      const f = e.features?.[0];
      if (!f) return;
      const p = f.properties;
      const catLabel = getCategoryLabel(p.category as PlaceCategory);
      popup
        .setLngLat((f.geometry as any).coordinates.slice())
        .setHTML(
          `<div class="gi-pop">
             <div class="gi-pop-title">${p.name}</div>
             <div class="gi-pop-row">
               <span>${catLabel}</span>
               <span class="gi-pop-km">${Number(p.distanceKm).toFixed(1)} km</span>
             </div>
             <div class="gi-pop-status">REAL MAP PLACE · OpenStreetMap</div>
           </div>`
        )
        .addTo(map);
    });
  }

  /* ── category filter handler ── */
  function applyFilter(map: MLMap, filter: PlaceCategory) {
    if (!map.getLayer("gi-real-places-points")) return;

    if (filter === "all") {
      map.setFilter("gi-real-places-points", null);
      map.setFilter("gi-real-places-halo", null);
      map.setFilter("gi-real-places-labels", null);
    } else {
      const f: any = ["==", ["get", "category"], filter];
      map.setFilter("gi-real-places-points", f);
      map.setFilter("gi-real-places-halo", f);
      map.setFilter("gi-real-places-labels", f);
    }
  }

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    applyFilter(map, activeFilter);
  }, [activeFilter, ready]);

  function wireInteractions(map: MLMap) {
    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: true,
      offset: 14,
      className: "gi-popup",
      maxWidth: "230px",
    });

    const showBiz = (e: any) => {
      map.getCanvas().style.cursor = "pointer";
      const f = e.features?.[0];
      if (!f) return;
      const p = f.properties;
      popup
        .setLngLat((f.geometry as any).coordinates.slice())
        .setHTML(
          `<div class="gi-pop">
             <div class="gi-pop-title">${p.name}</div>
             <div class="gi-pop-row"><span>${p.category} business</span><span class="gi-pop-km">${Number(p.distanceKm).toFixed(1)} km</span></div>
             <div class="gi-pop-status">DEMO DATA · simulated for prototype</div>
           </div>`
        )
        .addTo(map);
    };
    const hide = () => {
      map.getCanvas().style.cursor = "";
      popup.remove();
    };

    map.on("mouseenter", "gi-business-points", showBiz);
    map.on("mouseleave", "gi-business-points", hide);
    map.on("click", "gi-business-points", showBiz);

    map.on("mouseenter", "gi-clusters", () => (map.getCanvas().style.cursor = "pointer"));
    map.on("mouseleave", "gi-clusters", () => (map.getCanvas().style.cursor = ""));

    map.on("click", "gi-clusters", (e: any) => {
      const f = map.queryRenderedFeatures(e.point, { layers: ["gi-clusters"] })[0];
      if (!f) return;
      const cid = f.properties?.cluster_id;
      const src = map.getSource("gi-businesses-src") as any;
      src.getClusterExpansionZoom(cid, (_: any, zoom: number) => {
        map.easeTo({ center: (f.geometry as any).coordinates, zoom, duration: 800 });
      });
    });

    map.on("mouseenter", "gi-suppliers", (e: any) => {
      const f = e.features?.[0];
      if (!f) return;
      popup.setLngLat((f.geometry as any).coordinates.slice()).setHTML(
        `<div class="gi-pop">
           <div class="gi-pop-title">${f.properties.name}</div>
           <div class="gi-pop-row"><span>Supply node</span><span class="gi-pop-km">${Number(f.properties.distanceKm).toFixed(1)} km</span></div>
           <div class="gi-pop-status">DEMO DATA</div>
         </div>`
      ).addTo(map);
    });
    map.on("mouseleave", "gi-suppliers", hide);
  }

  /* ── error state ── */
  if (styleFailed) {
    return (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
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
            INTERACTIVE MAP OFFLINE · STORY CONTINUES
          </span>
          <span
            className="body-ui"
            title={failReason}
            style={{
              fontSize: 8.5,
              letterSpacing: ".14em",
              color: "rgba(237,234,223,.4)",
            }}
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
  const FILTER_CATS: { key: PlaceCategory; label: string }[] = [
    { key: "all", label: uiText(lang, "ALL") },
    { key: "market", label: uiText(lang, "MARKET") },
    { key: "food", label: uiText(lang, "FOOD") },
    { key: "landmark", label: `★ ${uiText(lang, "FAMOUS_PLACES")}` },
    { key: "retail", label: uiText(lang, "RETAIL") },
    { key: "healthcare", label: uiText(lang, "HEALTH") },
    { key: "education", label: uiText(lang, "EDUCATION") },
    { key: "finance", label: uiText(lang, "FINANCE") },
    { key: "transport", label: uiText(lang, "TRANSPORT") },
  ];

  const currentSearchLoc =
    progress !== undefined
      ? localizeMapStory(lang, MAP_STORY[Math.min(MAP_STORY.length - 1, Math.max(0, Math.floor(progress * MAP_STORY.length)))])
      : localizeMapStory(lang, MAP_STORY[0]);

  return (
    <>
      <div ref={containerRef} className="gi-map map-active" style={{ position: "absolute", inset: 0 }} />
      {ready && realPlacesCount===0 && (
        <div style={{position:"absolute", top:8, left:"50%", transform:"translateX(-50%)", zIndex:6, background:"rgba(255,255,255,0.92)", border:"1px solid rgba(20,35,28,0.12)", borderRadius:999, padding:"6px 12px", fontSize:10, letterSpacing:".08em"}}>{uiText(lang, "LIVE_DATA_UNAVAILABLE")}</div>
      )}
      {/* search bar removed for premium uncluttered map — location shown in bottom card */}
      {false && ready && (
        <div
          style={{
            position: "absolute",
            top: "calc(var(--nav-h) + 12px)",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 6,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#fff",
            borderRadius: 24,
            padding: "10px 18px",
            boxShadow: "0 2px 8px rgba(0,0,0,.18), 0 4px 16px rgba(0,0,0,.12)",
            width: "min(420px, calc(100% - 32px))",
            pointerEvents: "none",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" />
          </svg>
          <span style={{ fontSize: 13, color: "#202124", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {currentSearchLoc.subtitle.includes(currentSearchLoc.name) ? currentSearchLoc.subtitle : `${currentSearchLoc.name} · ${currentSearchLoc.subtitle}`}
          </span>
          <span style={{ fontSize: 11, color: "#5f6368", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", borderLeft: "1px solid #e8eaed", paddingLeft: 10, marginLeft: 2 }}>
            {currentSearchLoc.intelligenceLabel.toLowerCase()} · {currentSearchLoc.metric.value}
          </span>
        </div>
      )}
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
            transition: "opacity .5s",
            zIndex: 2,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <span className="body-ui" style={{ fontSize: 10, letterSpacing: ".2em", color: "#5f6368", display: "inline-flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 14, height: 14, border: "2px solid #dadce0", borderTopColor: "#1a73e8", borderRadius: 999, display: "inline-block", animation: "spin 0.9s linear infinite" }} />
              LOADING MAP · {attemptLabel.toUpperCase()}
            </span>
          </div>
        </div>
      )}
      {/* category filter chips */}
      {ready && realPlacesCount > 0 && (
        <div className="gi-filter-bar" role="group" aria-label="Filter places by category">
          {FILTER_CATS.map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveFilter(c.key)}
              className="gi-filter-chip"
              data-active={activeFilter === c.key}
              aria-pressed={activeFilter === c.key}
            >
              {c.key !== "all" && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 99,
                    background: getCategoryColor(c.key),
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
              )}
              {c.label}
            </button>
          ))}
        </div>
      )}
      {/* legend — Google white card */}
      {ready && realPlacesCount > 0 && (
        <div className="gi-legend" aria-label="Map legend">
          <div className="gi-legend-title">LOCAL PLACES · GANDIPET 8KM</div>
          <div className="gi-legend-row">
            <span style={{ width: 8, height: 8, borderRadius: 99, background: getCategoryColor("market"), boxShadow: "0 0 0 2px #fff, 0 1px 3px rgba(0,0,0,.2)" }} />
            <span>Market</span>
          </div>
          <div className="gi-legend-row">
            <span style={{ width: 8, height: 8, borderRadius: 99, background: getCategoryColor("food"), boxShadow: "0 0 0 2px #fff, 0 1px 3px rgba(0,0,0,.2)" }} />
            <span>Food</span>
          </div>
          <div className="gi-legend-row" style={{ fontWeight: 600, color: "#202124" }}>
            <span style={{ width: 9, height: 9, borderRadius: 99, background: getCategoryColor("landmark"), boxShadow: "0 0 0 2px #fff, 0 1px 4px rgba(0,0,0,.25)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 7 }}>★</span>
            <span>Famous Places</span>
          </div>
          <div className="gi-legend-row">
            <span style={{ width: 8, height: 8, borderRadius: 99, background: getCategoryColor("healthcare"), boxShadow: "0 0 0 2px #fff, 0 1px 3px rgba(0,0,0,.2)" }} />
            <span>Health</span>
          </div>
          <div className="gi-legend-row">
            <span style={{ width: 8, height: 8, borderRadius: 99, background: getCategoryColor("education"), boxShadow: "0 0 0 2px #fff, 0 1px 3px rgba(0,0,0,.2)" }} />
            <span>Education</span>
          </div>
          <div className="gi-legend-row">
            <span style={{ width: 8, height: 8, borderRadius: 99, background: getCategoryColor("finance"), boxShadow: "0 0 0 2px #fff, 0 1px 3px rgba(0,0,0,.2)" }} />
            <span>Finance</span>
          </div>
          <div className="gi-legend-row">
            <span style={{ width: 8, height: 8, borderRadius: 99, background: getCategoryColor("retail"), boxShadow: "0 0 0 2px #fff, 0 1px 3px rgba(0,0,0,.2)" }} />
            <span>Retail</span>
          </div>
          <div className="gi-legend-row">
            <span style={{ width: 8, height: 8, borderRadius: 99, background: getCategoryColor("transport"), boxShadow: "0 0 0 2px #fff, 0 1px 3px rgba(0,0,0,.2)" }} />
            <span>Transport</span>
          </div>
          <div className="gi-legend-row" style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid #e8eaed", opacity: 0.7 }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, border: "1.5px dashed #5f6368", background: "#fff" }} />
            <span>Demo data · clustered</span>
          </div>
        </div>
      )}
      {/* subtle vignette — very light for Positron */}
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(120% 100% at 50% 45%, transparent 72%, rgba(0,0,0,.035) 100%)", zIndex: 1 }} />

      {/* map is premium and always explorable — no center click wall */}
      {false && !mapInteractive && (
        <button
          type="button"
          onClick={activateMap}
          aria-label="Click to interact with map"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 5,
            cursor: "pointer",
            background: "transparent",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 72,
          }}
        >
          <span
            style={{
              background: "#fff",
              border: "1px solid #dadce0",
              borderRadius: 999,
              padding: "10px 18px",
              boxShadow: "0 2px 8px rgba(0,0,0,.18), 0 4px 16px rgba(0,0,0,.12)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              transition: "opacity .3s",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
            </svg>
            <span className="body-ui" style={{ fontSize: 10, letterSpacing: ".16em", color: "#202124", fontWeight: 600 }}>
              CLICK TO EXPLORE MAP
            </span>
          </span>
        </button>
      )}
      {false && mapInteractive && (
        <button
          type="button"
          onClick={deactivateMap}
          aria-label="Exit map interaction"
          style={{
            position: "absolute",
            top: "calc(var(--nav-h) + 14px)",
            right: "clamp(20px, 4vw, 60px)",
            zIndex: 5,
            cursor: "pointer",
            background: "rgba(7,26,20,.72)",
            border: "1px solid var(--line-on-dark)",
            borderRadius: 999,
            padding: "8px 16px",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--gold)" }}>
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          <span className="body-ui" style={{ fontSize: 9, letterSpacing: ".2em", color: "var(--text-light)" }}>
            EXIT MAP
          </span>
        </button>
      )}
    </>
  );
}
