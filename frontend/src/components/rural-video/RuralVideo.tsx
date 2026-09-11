"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useMediaQuery } from "@/lib/hooks";
import { useUiLang } from "@/lib/landing-strings";
import { uiText } from "@/lib/ui-strings";

const YOUTUBE_ID = "BGvJQ0bZn8w";
const POSTER_URL = "https://images.pexels.com/photos/36739505/pexels-photo-36739505.jpeg?auto=compress&cs=tinysrgb&w=1920&q=82";

export function RuralVideo() {
  const lang = useUiLang();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [ytFailed, setYtFailed] = useState(false);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    if (reduced) return;
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setShouldLoad(true), { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <section
      ref={sectionRef}
      style={{
        position: "relative",
        height: "100svh",
        minHeight: "100svh",
        overflow: "hidden",
        background: "#04100C",
        isolation: "isolate",
      }}
    >
      {/* ——— full-bleed video ——— */}
      <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#04100C" }}>
        {shouldLoad && !ytFailed ? (
          <motion.div
            initial={{ scale: 1.06 }}
            animate={{ scale: 1.12 }}
            transition={{ duration: 18, ease: "linear" as any }}
            style={{ position: "absolute", inset: 0, overflow: "hidden" }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${YOUTUBE_ID}?autoplay=1&mute=1&loop=1&playlist=${YOUTUBE_ID}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=0&iv_load_policy=3`}
              title="Rural Indian market — field documentation"
              allow="autoplay; encrypted-media"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "100vw",
                height: "56.25vw",
                minHeight: "100%",
                minWidth: "177.78vh",
                transform: "translate(-50%, -50%) scale(1.02)",
                border: "none",
                filter: "saturate(.92) brightness(.88) contrast(1.04)",
              }}
              onError={() => setYtFailed(true)}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 1.04 }}
            whileInView={{ scale: 1.08 }}
            viewport={{ once: true }}
            transition={{ duration: 14, ease: [0.16, 1, 0.3, 1] as any }}
            style={{
              position: "absolute",
              inset: -24,
              background: `url(${POSTER_URL}) center/cover no-repeat`,
              filter: "saturate(.88) brightness(.86) contrast(1.04)",
            }}
          />
        )}

        {/* premium film grain */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.07,
            mixBlendMode: "overlay",
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ——— cinematic overlay ——— */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background:
            "radial-gradient(90% 85% at 50% 38%, rgba(4,16,12,0) 0%, rgba(4,16,12,.18) 55%, rgba(4,16,12,.72) 100%), linear-gradient(180deg, rgba(4,16,12,.22) 0%, rgba(4,16,12,.18) 42%, rgba(4,16,12,.68) 100%)",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background: "linear-gradient(90deg, rgba(4,16,12,.42) 0%, transparent 28%, transparent 72%, rgba(4,16,12,.38) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* top hairline */}
      <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "rgba(237,234,223,.12)", zIndex: 2 }} />

      {/* ——— content ——— */}
      <div
        className="shell"
        style={{
          position: "relative",
          zIndex: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          paddingBlock: "clamp(48px, 8vh, 80px)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] as any }}
          style={{ maxWidth: 860 }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
            <span aria-hidden style={{ width: 28, height: 1, background: "var(--gold)", display: "inline-block" }} />
            <span className="body-ui" style={{ color: "var(--gold-bright)", fontSize: 10, letterSpacing: ".32em" }}>
              {uiText(lang, "FIELD_DOCUMENTATION")}
            </span>
          </div>

          <h2 className="display-xl serif-i" style={{ color: "#F3EFE2", fontSize: "clamp(42px, 7vw, 108px)", lineHeight: 0.92, letterSpacing: "-.025em", textWrap: "balance" }}>
            {uiText(lang, "EVERY_BUSINESS")}<br />
            {uiText(lang, "STARTS_SOMEWHERE")}
          </h2>

          <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] as any }} style={{ height: 1, width: 72, background: "var(--gold)", margin: "28px auto 0", transformOrigin: "center" }} />

          <p className="body-lg" style={{ color: "rgba(237,234,223,.78)", fontSize: "clamp(15px, 1.5vw, 19px)", lineHeight: 1.7, maxWidth: 560, margin: "22px auto 0", textWrap: "balance" }}>
            {uiText(lang, "VILLAGE_MARKET_NEED")}
            <br />
            {uiText(lang, "LOCAL_SIGNAL_SENTENCE")}
          </p>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginTop: 28, background: "rgba(7,26,20,.46)", border: "1px solid rgba(237,234,223,.16)", borderRadius: 999, padding: "10px 18px", backdropFilter: "blur(8px)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: "#22C55E", boxShadow: "0 0 0 6px rgba(34,197,94,.14)", flexShrink: 0 }} />
        <span className="body-ui" style={{ fontSize: 9, letterSpacing: ".18em", color: "rgba(237,234,223,.9)" }}>{uiText(lang, "LIVE_GEOGRAPHY")}</span>
          </div>
        </motion.div>
      </div>

      {/* bottom meta */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "0 clamp(18px, 3vw, 32px) 18px", pointerEvents: "none" }}>
        <span className="body-ui" style={{ fontSize: 7.5, letterSpacing: ".22em", color: "rgba(237,234,223,.42)" }}>17.3835°N · 78.3222°E · GANDIPET · HYDERABAD</span>
        <span className="body-ui" style={{ fontSize: 7, letterSpacing: ".18em", color: "rgba(237,234,223,.32)" }}>{uiText(lang, "DEMO_PURPOSES")}</span>
      </div>

      {/* discovery */}
      <div style={{ position: "absolute", left: "50%", bottom: 18, transform: "translateX(-50%)", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, pointerEvents: "none" }}>
        <span className="body-ui" style={{ fontSize: 7.5, letterSpacing: ".28em", color: "rgba(237,234,223,.52)" }}>{uiText(lang, "LIVE_DISCOVERY")}</span>
        <span style={{ width: 1, height: 28, background: "linear-gradient(180deg, rgba(237,234,223,.55), transparent)", display: "block" }} />
      </div>
    </section>
  );
}
