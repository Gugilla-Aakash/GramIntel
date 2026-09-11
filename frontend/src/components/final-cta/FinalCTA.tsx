"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MagneticButton } from "../primitives/MagneticButton";
import { VideoBackground } from "../media/VideoBackground";
import { MEDIA } from "@/lib/media";
import { demoData } from "@/lib/demo-data";
import { Icon } from "../icons";
import { useUiLang } from "@/lib/landing-strings";
import { uiText } from "@/lib/ui-strings";

export function FinalCTA() {
  const lang = useUiLang();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const l1Op = useTransform(p, [0.1, 0.28], [1, 0]);
  const l1Y = useTransform(p, [0.1, 0.28], [0, -28]);
  const l2Op = useTransform(p, [0.22, 0.4], [0, 1]);
  const l2Y = useTransform(p, [0.22, 0.4], [24, 0]);

  const rowsOp = useTransform(p, [0.32, 0.5], [0, 1]);
  const rowsY = useTransform(p, [0.32, 0.5], [18, 0]);
  const statsOp = useTransform(p, [0.44, 0.62], [0, 1]);
  const statsY = useTransform(p, [0.44, 0.62], [18, 0]);
  const ctaOp = useTransform(p, [0.58, 0.76], [0, 1]);
  const ctaScale = useTransform(p, [0.58, 0.8], [0.96, 1]);

  return (
    <section
      id="analyze"
      ref={ref}
      style={{
        height: "280vh",
        position: "relative",
        background: "linear-gradient(180deg,#071A14 0%,#0B3D2A 38%,#06281C 100%)",
        overflow: "clip",
      }}
    >
      <VideoBackground
        sources={[MEDIA.sunriseCountryside.mp4, MEDIA.sunriseCountryside.fallback]}
        opacity={0.13}
        filter="saturate(.5) brightness(.9)"
        overlay="linear-gradient(180deg, rgba(7,26,20,.62), rgba(6,40,28,.78))"
      />

      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100svh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          paddingTop: "var(--nav-h)",
          boxSizing: "border-box",
          zIndex: 1,
        }}
      >
        {/* converging geographic lines — subtle */}
        <svg
          aria-hidden
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.28, pointerEvents: "none" }}
        >
          {[
            "M -40 120 C 300 180, 520 300, 600 400",
            "M -40 680 C 320 620, 500 480, 600 400",
            "M 1240 140 C 900 190, 700 300, 600 400",
            "M 1240 660 C 880 630, 720 470, 600 400",
            "M 240 -40 C 380 160, 520 280, 600 400",
            "M 960 -40 C 820 170, 680 290, 600 400",
            "M 260 840 C 390 660, 510 520, 600 400",
            "M 940 840 C 810 650, 690 510, 600 400",
          ].map((d, i) => (
            <motion.path
              key={i}
              d={d}
              fill="none"
              stroke="rgba(169,195,174,.2)"
              strokeWidth={1}
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.9, delay: i * 0.09, ease: [0.65, 0, 0.35, 1] }}
            />
          ))}
          <circle cx={600} cy={400} r={5} fill="#E3B75B" />
          <circle cx={600} cy={400} r={18} fill="none" stroke="rgba(227,183,91,.28)">
            <animate attributeName="r" values="14;32;14" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values=".45;.06;.45" dur="3s" repeatCount="indefinite" />
          </circle>
        </svg>

        <div className="shell" style={{ position: "relative", textAlign: "center", width: "100%", maxWidth: 980 }}>
          {/* eyebrow */}
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="eyebrow" style={{ color: "var(--gold)", marginBottom: 18, letterSpacing: ".32em" }}>
            {uiText(lang, "THE_DECISION")}
          </motion.div>

          {/* two-part statement — cross-fade but both stay inside viewport */}
          <div style={{ position: "relative", height: "clamp(88px, 14vh, 150px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.div initial={false} style={{ opacity: l1Op, y: l1Y, position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="display-xl serif-i" style={{ color: "var(--text-light)", display: "block", fontSize: "clamp(36px, 6.2vw, 92px)", lineHeight: 0.98, letterSpacing: "-.02em" }}>
                {uiText(lang, "DONT_START_LOAN")}
              </span>
            </motion.div>
            <motion.div
              initial={false}
              style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: l2Op, y: l2Y }}
            >
              <span className="display-xl serif-i" style={{ color: "var(--gold-bright)", fontSize: "clamp(36px, 6.2vw, 92px)", lineHeight: 0.98, letterSpacing: "-.02em" }}>
                {uiText(lang, "START_DECISION")}
              </span>
            </motion.div>
          </div>

          {/* three pillars — always visible, fade in early so viewport never feels empty */}
          <motion.div initial={false} style={{ opacity: rowsOp, y: rowsY, marginTop: "clamp(22px, 4vh, 36px)", maxWidth: 760, marginInline: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, textAlign: "left" }}>
              {[
                { n: "01", t: uiText(lang, "UNDERSTAND_MARKET"), d: uiText(lang, "PILLAR_MARKET_DETAIL") },
                { n: "02", t: uiText(lang, "UNDERSTAND_OPPORTUNITY"), d: uiText(lang, "PILLAR_OPPORTUNITY_DETAIL") },
                { n: "03", t: uiText(lang, "UNDERSTAND_FINANCES"), d: uiText(lang, "PILLAR_FINANCE_DETAIL") },
              ].map((r) => (
                <div key={r.n} style={{ background: "rgba(255,255,255,.035)", border: "1px solid var(--line-on-dark)", borderRadius: 14, padding: "16px 16px 14px", backdropFilter: "blur(6px)" }}>
                  <span className="mono-num" style={{ fontSize: 10, color: "var(--gold)", letterSpacing: ".2em" }}>{r.n}</span>
                  <div className="body-lg" style={{ color: "var(--text-light)", fontSize: 14.5, lineHeight: 1.4, marginTop: 8, fontWeight: 500 }}>{r.t}</div>
                  <div className="mono-num" style={{ color: "rgba(237,234,223,.52)", fontSize: 11, marginTop: 6 }}>{r.d}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* live stats bar — new proof (deduplicated from MarketCloseup/MapStory) */}
          <motion.div initial={false} style={{ opacity: statsOp, y: statsY, marginTop: "clamp(22px, 4vh, 30px)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, maxWidth: 520, marginInline: "auto" }}>
              {[
                { v: "78/100", l: uiText(lang, "OPPORTUNITY").toUpperCase(), sub: `${uiText(lang, "DAIRY_COOPS")} · ${uiText(lang, "GOOD_POTENTIAL_LABEL")}` },
                { v: "3", l: uiText(lang, "DAIRY_COOPS").toUpperCase(), sub: uiText(lang, "SUPPLY_RADIUS") },
              ].map((s) => (
                <div key={s.l} style={{ background: "linear-gradient(180deg, rgba(227,183,91,.12), rgba(7,26,20,.55))", border: "1px solid rgba(227,183,91,.22)", borderRadius: 14, padding: "18px 14px", textAlign: "center" }}>
                  <div className="mono-num" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px, 2.6vw, 30px)", color: "var(--gold-bright)", lineHeight: 1 }}>{s.v}</div>
                  <div className="body-ui" style={{ fontSize: 7.5, letterSpacing: ".18em", color: "var(--text-light)", marginTop: 7 }}>{s.l}</div>
                  <div style={{ fontSize: 9, color: "rgba(237,234,223,.42)", marginTop: 4 }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA — appears earlier, always anchored */}
          <motion.div initial={false} style={{ opacity: ctaOp, scale: ctaScale, marginTop: "clamp(22px, 4vh, 32px)" }}>
            <MagneticButton
              cursor="view"
              cursorLabel="GO"
              strength={0.35}
              onClick={() => { window.location.href = "/assistant"; }}
              style={{
                background: "#F3EFE2",
                color: "#071A14",
                borderRadius: 999,
                padding: "18px 36px",
                display: "inline-flex",
                alignItems: "center",
                gap: 16,
                boxShadow: "0 18px 60px rgba(0,0,0,.42), 0 0 0 1px rgba(255,255,255,.06) inset",
              }}
            >
              <span className="body-ui" style={{ fontSize: 12, letterSpacing: ".28em", fontWeight: 700 }}>{uiText(lang, "ANALYZE_CTA_UPPER")}</span>
              <span style={{ display: "inline-flex", color: "#0B5D3B", background: "#fff", borderRadius: 999, width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
                <Icon.ArrowRight size={16} strokeWidth={2} />
              </span>
            </MagneticButton>
            <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: "#22C55E", boxShadow: "0 0 0 4px rgba(34,197,94,.15)" }} />
              <span className="body-ui" style={{ fontSize: 8, letterSpacing: ".2em", color: "rgba(237,234,223,.55)" }}>{uiText(lang, "PROTOTYPE_NOTE")}</span>
              <span className="body-ui" style={{ fontSize: 8, letterSpacing: ".18em", color: "rgba(237,234,223,.32)" }}>· {uiText(lang, "GANDIPET_HYDERABAD").toUpperCase()}</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
