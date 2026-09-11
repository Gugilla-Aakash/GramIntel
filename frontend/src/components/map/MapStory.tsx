"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MAP_STORY, NUM_STAGES } from "@/lib/map/map-story";
import { localizeMapStory } from "@/lib/map/map-story-strings";
import { useMediaQuery } from "@/lib/hooks";
import { DataConfidenceBadge } from "../data-source/DataConfidenceBadge";
import { Icon } from "../icons";
import { useUiLang } from "@/lib/landing-strings";
import { uiText } from "@/lib/ui-strings";

gsap.registerPlugin(ScrollTrigger);

const GramIntelMap = dynamic(() => import("./GramIntelMap"), { ssr: false });

function Chip({
  label,
  value,
  gold,
  big,
}: {
  label: string;
  value: string;
  gold?: boolean;
  big?: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: "column",
        gap: 2,
        borderLeft: `2px solid ${gold ? "var(--gold)" : "rgba(169,195,174,.45)"}`,
        paddingLeft: 10,
      }}
    >
      <span className="body-ui" style={{ fontSize: 8, letterSpacing: ".22em", color: "#5f6368" }}>
        {label}
      </span>
      <span
        className="mono-num"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: big ? 22 : 15,
          color: gold ? "#9A6E1F" : "#202124",
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
    </span>
  );
}

export function MapStory() {
  const lang = useUiLang();
  const sectionRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [mountMap, setMountMap] = useState(false);
  const isTouch = useMediaQuery("(pointer: coarse)");
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");

  // mount immediately + preload all 5 — crystal clear before scroll
  useEffect(() => { setMountMap(true); }, []);
  useEffect(() => {
    // warm Overpass cache for every stage on page load
    import("@/lib/places").then(({ fetchPlacesNear }) => {
      MAP_STORY.forEach((l) => fetchPlacesNear(l.lat, l.lng, 8000).catch(() => {}));
    });
  }, []);

  // GSAP pin + scrub — single source of truth
  useEffect(() => {
    if (reduced) return;
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    if (!section || !viewport) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        pin: viewport,
        pinSpacing: true,
        scrub: 0.55,
        anticipatePin: 1,
        start: "top top",
        end: () => `+=${window.innerHeight * 4}`,
        onUpdate: (self) => {
          // adaptive: directly set progress — GSAP handles velocity smoothing
          setProgress(self.progress);
        },
      });
    }, section);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [reduced]);

  // reduced motion fallback: simple scroll listener to update progress without pin
  useEffect(() => {
    if (!reduced) return;
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const p = Math.max(0, Math.min(1, -rect.top / Math.max(1, total)));
      setProgress(p);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [reduced]);

  const stage = Math.min(NUM_STAGES - 1, Math.max(0, Math.floor(progress * NUM_STAGES)));
  const loc = localizeMapStory(lang, MAP_STORY[stage]);

  return (
    <section
      id="market"
      ref={sectionRef}
      style={{ height: "500vh", position: "relative", background: "#F8F9FA", overflow: "clip" }}
    >
      <div
        ref={viewportRef}
        style={{
          position: "sticky",
          top: 0,
          height: "100svh",
          overflow: "hidden",
          background: "#F8F9FA",
        }}
      >
        {/* ——— MAP ——— premium framed, once around — dark hairline */}
        <div style={{ position: "absolute", inset: 10, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(7,26,20,.14)", boxShadow: "0 12px 40px rgba(7,26,20,.12), 0 2px 8px rgba(0,0,0,.06)", background: "#fff" }}>
          {mountMap && <GramIntelMap progress={progress} />}
        </div>

        {/* subtle vignette for text legibility — very light for positron */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(248,249,250,.08) 0%, transparent 22%, transparent 62%, rgba(248,249,250,.12) 100%)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />

        {/* ——— TOP ——— */}
        <div
          style={{
            position: "absolute",
            top: "calc(var(--nav-h) + 10px)",
            left: 0,
            right: 0,
            zIndex: 5,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            className="body-ui"
            style={{
              fontSize: 9,
              letterSpacing: ".22em",
              color: "#5f6368",
              background: "rgba(255,255,255,.9)",
              border: "1px solid #dadce0",
              borderRadius: 999,
              padding: "6px 14px",
              boxShadow: "0 1px 4px rgba(0,0,0,.08)",
            }}
          >
            TELANGANA INTELLIGENCE JOURNEY · {loc.n} / 05
          </div>
        </div>

        {/* ——— RIGHT RAIL ——— */}
        <div
          className="gi-rail"
          style={{
            position: "absolute",
            right: 14,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 6,
            display: isTouch ? "none" : "grid",
            gap: 10,
            background: "rgba(255,255,255,.92)",
            border: "1px solid #e8eaed",
            borderRadius: 999,
            padding: "14px 10px",
            boxShadow: "0 2px 10px rgba(0,0,0,.08)",
          }}
        >
          {MAP_STORY.map((s, i) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span
                title={s.name}
                style={{
                  width: i === stage ? 22 : 8,
                  height: 8,
                  borderRadius: 99,
                  background: i === stage ? "#1a73e8" : i < stage ? "#7FA98F" : "#dadce0",
                  transition: "all .35s ease",
                  display: "block",
                  boxShadow: i === stage ? "0 1px 4px rgba(26,115,232,.35)" : "none",
                }}
              />
            </div>
          ))}
        </div>

        {/* ——— BOTTOM CARD ——— */}
        <div
          style={{
            position: "absolute",
            left: "clamp(14px, 2.2vw, 20px)",
            bottom: "clamp(14px, 2.5vh, 20px)",
            zIndex: 7,
            maxWidth: "min(420px, calc(100% - 28px))",
            width: "100%",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,.96)",
              border: "1px solid #dadce0",
              borderRadius: 16,
              padding: "20px 20px 16px",
              boxShadow: "0 8px 28px rgba(0,0,0,.16), 0 2px 8px rgba(0,0,0,.1)",
              backdropFilter: "blur(12px)",
              pointerEvents: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ color: "#9A6E1F", display: "inline-flex" }}>
                <Icon.Pin size={14} />
              </span>
              <span className="body-ui" style={{ fontSize: 8.5, letterSpacing: ".28em", color: "#9A6E1F", fontWeight: 700 }}>
                {loc.n} · {loc.name.toUpperCase()}
              </span>
              <span className="body-ui" style={{ fontSize: 7, letterSpacing: ".16em", color: "#5f6368", marginLeft: "auto", background: "#f8f9fa", border: "1px solid #e8eaed", borderRadius: 999, padding: "3px 8px" }}>
                {loc.dataStatus === "demo" ? "DEMO DATA" : loc.dataStatus === "estimate" ? "AI ESTIMATE" : "REAL MAP DATA"}
              </span>
            </div>

            <div className="body-ui" style={{ fontSize: 9, letterSpacing: ".16em", color: "#5f6368", marginBottom: 6 }}>
              {loc.subtitle}
            </div>

            <h3 className="display-m" style={{ fontSize: "clamp(22px, 2.6vw, 28px)", color: "#202124", lineHeight: 1.1, fontWeight: 600 }}>
              {loc.intelligenceLabel}
            </h3>

            <p style={{ marginTop: 8, fontSize: 13.5, lineHeight: 1.6, color: "#5f6368" }}>{loc.narrative}</p>

            <p style={{ marginTop: 8, fontSize: 11.5, lineHeight: 1.5, color: "#202124", background: "#f8f9fa", border: "1px solid #e8eaed", borderRadius: 8, padding: "8px 10px" }}>
              {loc.intelligenceDetail}
            </p>

            <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 14, paddingTop: 14, borderTop: "1px solid #e8eaed", flexWrap: "wrap" }}>
              <Chip label={loc.metric.label} value={loc.metric.value} gold />
              <span className="body-ui" style={{ fontSize: 8, color: "#5f6368", marginLeft: "auto" }}>{loc.metric.sub}</span>
            </div>

            <div className="body-ui" style={{ fontSize: 7.5, letterSpacing: ".16em", color: "#9e9e9e", marginTop: 12, textAlign: "center" }}>
              {loc.context} · {loc.lng.toFixed(4)}°E {loc.lat.toFixed(4)}°N
            </div>
          </div>
        </div>

        {/* tip outside map — fixed below, not covering */}
        <div
          className="gi-outside-tip"
          style={{
            position: "fixed",
            bottom: 14,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 60,
            display: isTouch ? "none" : progress > 0.02 && progress < 0.98 ? "flex" : "none",
            alignItems: "center",
            gap: 8,
            background: "#fff",
            border: "1px solid #dadce0",
            borderRadius: 999,
            padding: "7px 14px",
            boxShadow: "0 4px 16px rgba(0,0,0,.12), 0 1px 4px rgba(0,0,0,.08)",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: 99, background: "#1a73e8", flexShrink: 0 }} />
          <span className="body-ui" style={{ fontSize: 7.5, letterSpacing: ".14em", color: "#202124", fontWeight: 600 }}>
            {uiText(lang, "TIP_ZOOM")}
          </span>
        </div>

        {/* mobile progress dots — bottom center */}
        {isTouch && (
          <div
            style={{
              position: "absolute",
              bottom: 14,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 7,
              display: "flex",
              gap: 6,
              background: "rgba(255,255,255,.9)",
              border: "1px solid #e8eaed",
              borderRadius: 999,
              padding: "8px 12px",
              boxShadow: "0 2px 8px rgba(0,0,0,.1)",
            }}
          >
            {MAP_STORY.map((s, i) => (
              <span
                key={s.id}
                style={{
                  width: i === stage ? 18 : 7,
                  height: 7,
                  borderRadius: 99,
                  background: i === stage ? "#1a73e8" : "#dadce0",
                  transition: "all .3s ease",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
