"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useIsMobile, useMediaQuery } from "@/lib/hooks";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────────────────
   SCROLL STORY — reusable GSAP + ScrollTrigger system

   OUTER SECTION  (tall, provides scroll distance)
     └─ PINNED VIEWPORT (sticky, 100svh, stays fixed)
          └─ HORIZONTAL TRACK (flex row, scrubs via x)

   Contract:
   - section height = 100vh + horizontal travel
   - viewport is pinned for travel distance
   - track.x: 0 → -travel, scrubbed 1:1 with scroll
   - progress 0→1 drives chapter active state
   - mobile: no pin, vertical stack
   - Lenis sync + ResizeObserver + cleanup via gsap.context
   ───────────────────────────────────────────────────────── */

interface HorizontalScrollStoryProps {
  id: string;
  background?: string;
  /** optional background layer behind the viewport (e.g. VideoBackground + washes) */
  viewportBg?: React.ReactNode;
  /** called with 0→1 progress for chapter/active state */
  onProgress?: (p: number) => void;
  /** header rendered above the track, inside pinned viewport */
  header?: React.ReactNode;
  /** rail rendered below the track */
  rail?: React.ReactNode;
  /** amount of extra scroll beyond travel (px) — default 0 */
  extraScroll?: number;
  children: React.ReactNode; // the horizontal track's children (chapters)
}

export function HorizontalScrollStory({
  id,
  background = "#071A14",
  viewportBg,
  onProgress,
  header,
  rail,
  extraScroll = 0,
  children,
}: HorizontalScrollStoryProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const shouldReduceMotion = isMobile || prefersReducedMotion;

  // travel = track.scrollWidth - viewport.clientWidth
  const [travel, setTravel] = useState(0);
  const [ready, setReady] = useState(false);

  // ── measure travel ──
  useLayoutEffect(() => {
    if (shouldReduceMotion) return;
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport) return;

    const measure = () => {
      // wait for fonts/layout
      const t = track.scrollWidth - viewport.clientWidth;
      // small fudge so last card isn't clipped at edge
      const next = Math.max(0, t + 24);
      setTravel(next);
      setReady(true);
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(track);
    ro.observe(viewport);
    window.addEventListener("resize", measure);
    // fonts can change layout after load
    document.fonts?.ready.then(measure).catch(() => {});

    const t1 = window.setTimeout(measure, 100);
    const t2 = window.setTimeout(measure, 400);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [shouldReduceMotion, children]);

  // ── GSAP pin + scrub ──
  useEffect(() => {
    if (shouldReduceMotion) return;
    if (!ready) return;
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!section || !viewport || !track) return;
    if (travel <= 0) return;

    const ctx = gsap.context(() => {
      // ensure ScrollTrigger knows about Lenis if present
      ScrollTrigger.refresh();

      const tween = gsap.to(track, {
        x: -travel,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          pin: viewport,
          pinSpacing: true,
          anticipatePin: 1,
          scrub: 1,
          start: "top top",
          end: () => `+=${travel + extraScroll}`,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            onProgress?.(self.progress);
          },
          // debug markers in dev — enable with ?debug=1
          // markers: typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug"),
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    }, section);

    // refresh after pin creation to get correct start/end
    ScrollTrigger.refresh();

    return () => {
      ctx.revert();
    };
  }, [shouldReduceMotion, ready, travel, extraScroll, onProgress]);

  // ── mobile / reduced-motion: vertical stack (no pin) ──
  if (shouldReduceMotion) {
    return (
      <section
        id={id}
        style={{
          background,
          paddingBlock: "clamp(72px, 10vh, 120px)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="shell" style={{ position: "relative", zIndex: 1 }}>
          {header}
          <div style={{ display: "grid", gap: 56, marginTop: 32 }}>{children}</div>
          {rail}
        </div>
      </section>
    );
  }

  // ── desktop: pinned horizontal story ──
  // outer height = viewport + travel → exactly enough scroll to show all cards
  const sectionHeight = ready ? `calc(100svh + ${travel + extraScroll}px)` : "100svh";

  return (
    <section
      id={id}
      ref={sectionRef}
      style={{
        background,
        height: sectionHeight,
        position: "relative",
        // IMPORTANT: outer must NOT be overflow:hidden — it would clip the pin spacer
        // and break sticky. Only the viewport clips horizontally.
        overflow: "clip",
        // ensure no ancestor transform interferes: this section itself must not have transform
      }}
    >
      {/* pinned viewport — stays fixed for travel px of scroll */}
      <div
        ref={viewportRef}
        className="ss-viewport"
        style={{
          position: "sticky",
          top: 0,
          height: "100svh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          // account for fixed nav so content doesn't hide behind it
          paddingTop: "var(--nav-h)",
          boxSizing: "border-box",
        }}
      >
        {viewportBg && (
          <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
            {viewportBg}
          </div>
        )}

        {/* header */}
        {header && (
          <div className="shell" style={{ position: "relative", zIndex: 2, width: "100%" }}>
            {header}
          </div>
        )}

        {/* horizontal track — the only element that moves */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            overflow: "hidden",
            width: "100%",
            marginTop: "clamp(16px, 3vh, 32px)",
            marginBottom: "clamp(16px, 3vh, 32px)",
          }}
        >
          <div
            ref={trackRef}
            className="ss-track"
            style={{
              display: "flex",
              gap: "clamp(40px, 5vw, 96px)",
              paddingInline: "max(24px, calc((100vw - 1440px)/2))",
              paddingRight: "12vw",
              willChange: "transform",
              width: "max-content",
            }}
          >
            {children}
          </div>
        </div>

        {/* rail */}
        {rail && (
          <div className="shell" style={{ position: "relative", zIndex: 2, width: "100%" }}>
            {rail}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   PINNED CROSS-FADE — for FinancialStory (₹ amounts)

   Same pin contract, but children cross-fade in place
   instead of horizontal translate. Each child stays
   vertically centered; only opacity/scale change.
   ───────────────────────────────────────────────────────── */

interface PinnedCrossFadeProps {
  id: string;
  background?: string;
  viewportBg?: React.ReactNode;
  onProgress?: (p: number) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode; // each child is a "stage" — we show one at a time based on progress
}

export function PinnedCrossFade({
  id,
  background = "#071A14",
  viewportBg,
  onProgress,
  header,
  footer,
  children,
}: PinnedCrossFadeProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const prefersReducedMotion2 = useMediaQuery("(prefers-reduced-motion: reduce)");
  const shouldReduceMotion2 = isMobile || prefersReducedMotion2;
  const childArray = React.Children.toArray(children);
  const num = childArray.length;

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion2) return;
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    if (!section || !viewport) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        pin: viewport,
        pinSpacing: true,
        anticipatePin: 1,
        scrub: 1,
        start: "top top",
        // give enough scroll distance for num stages to be comfortably scrubbed
        end: () => `+=${num * 520}`,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          setProgress(self.progress);
          onProgress?.(self.progress);
        },
      });
    }, section);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [shouldReduceMotion2, num, onProgress]);

  if (shouldReduceMotion2) {
    return (
      <section
        id={id}
        style={{
          background,
          paddingBlock: "clamp(72px, 10vh, 120px)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="shell" style={{ position: "relative", zIndex: 1 }}>
          {header}
          <div style={{ display: "grid", gap: 56, marginTop: 32 }}>
            {childArray.map((c, i) => (
              <div key={i}>{c}</div>
            ))}
          </div>
          {footer}
        </div>
      </section>
    );
  }

  // desktop: pinned, height = 100vh + num*520
  const sectionHeight = `calc(100svh + ${num * 520}px)`;

  return (
    <section
      id={id}
      ref={sectionRef}
      style={{
        background,
        height: sectionHeight,
        position: "relative",
        overflow: "clip",
      }}
    >
      <div
        ref={viewportRef}
        className="ss-viewport"
        style={{
          position: "sticky",
          top: 0,
          height: "100svh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: "var(--nav-h)",
          boxSizing: "border-box",
          textAlign: "center",
        }}
      >
        {viewportBg && (
          <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
            {viewportBg}
          </div>
        )}

        {header && (
          <div
            className="shell"
            style={{
              position: "absolute",
              top: "calc(var(--nav-h) + 18px)",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 3,
              width: "min(1440px, calc(100% - clamp(40px, 8vw, 128px)))",
              opacity: progress < 0.14 ? 0 : 1,
              pointerEvents: progress < 0.14 ? "none" : "auto",
              transition: "opacity 0.35s ease",
            }}
          >
            {header}
          </div>
        )}

        {/* stages — cross-fade, positioned at lower viewport to avoid covering prior diagram */}
        <div
          className="shell"
          style={{
            position: "absolute",
            bottom: "clamp(80px, 18vh, 140px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(760px, calc(100% - 32px))",
            height: "clamp(220px, 36vh, 320px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          {childArray.map((child, i) => {
            const sliceStart = i / num;
            const sliceEnd = (i + 1) / num;
            const mid = (sliceStart + sliceEnd) / 2;
            const dist = Math.abs(progress - mid);
            const proximity = 1 - dist / (1 / num);
            // hide all stages during initial pin settlement (prevents early overlap with previous section)
            // increased guard so ₹1,00,000 doesn't peek while previous section is still in view
            const earlyGuard = progress < 0.14 ? 0 : 1;
            const opacity = Math.max(0, Math.min(1, proximity * 1.8 - 0.2)) * earlyGuard;
            const scale = 0.92 + 0.08 * Math.max(0, Math.min(1, proximity));
            const y = (progress - mid) * 28;

            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity,
                  transform: `scale(${scale}) translateY(${y}px)`,
                  willChange: "transform, opacity",
                  pointerEvents: opacity > 0.5 ? "auto" : "none",
                }}
              >
                {child}
              </div>
            );
          })}
        </div>

        {footer && (
          <div style={{ position: "absolute", bottom: "clamp(18px, 4vh, 36px)", left: "50%", transform: "translateX(-50%)", zIndex: 3, width: "min(1440px, calc(100% - clamp(40px, 8vw, 128px)))" }}>
            {footer}
          </div>
        )}
      </div>
    </section>
  );
}
