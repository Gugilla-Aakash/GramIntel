"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "../primitives/AnimatedNumber";
import { SectionLabel } from "../primitives/SectionLabel";
import { DataConfidenceBadge } from "../data-source/DataConfidenceBadge";
import { DataSourceLabel } from "../data-source/DataSourceLabel";
import { useUiLang } from "@/lib/landing-strings";
import { uiText } from "@/lib/ui-strings";
import { DATA, tdyn, type UiLang } from "@/lib/assistant-strings";

const METRICS: any[] = [
  { label: "MARKET DEMAND", v: 82, note: "1,240 consumers · rising milk spend" },
  { label: "COMPETITION", v: 61, note: "7 direct · none value-added" },
  { label: "PRICING POWER", v: 72, note: "12–18% premium achievable" },
  { label: "SUPPLY ACCESS", v: 79, note: "3 dairy co-ops within 6 km" },
  { label: "FINANCIAL FIT", v: 81, note: "matches term-loan structure" },
  { label: "RISK EXPOSURE", v: 52, note: "seasonal dips · power supply", warn: true },
];

function Gauge({ v, warn }: { v: number; warn?: boolean }) {
  const color = warn ? "#D97A2B" : "#0B5D3B";
  return (
    <svg width="66" height="66" viewBox="0 0 66 66" aria-hidden>
      <circle cx="33" cy="33" r="27" fill="none" stroke="rgba(20,35,28,.1)" strokeWidth="4" />
      <motion.circle
        cx="33"
        cy="33"
        r="27"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        transform={`rotate(-90 33 33)`}
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: v / 100 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
      />
    </svg>
  );
}

export function ViabilityScore() {
  const lang = useUiLang();
  return (
    <section
      id="viability"
      className="section-pad"
      style={{ background: "var(--cream)" }}
    >
      <div className="shell">
        <SectionLabel index="06" title="BUSINESS VIABILITY" />

        {/* ── the verdict ── */}
        <div style={{ position: "relative", textAlign: "center", padding: "clamp(20px,5vh,60px) 0 clamp(50px,9vh,110px)" }}>
          {/* sweeping halo gauge */}
          <svg
            aria-hidden
            viewBox="0 0 520 520"
            style={{
              position: "absolute",
              left: "50%",
              top: "52%",
              width: "min(74vw, 500px)",
              height: "auto",
              transform: "translate(-50%,-50%)",
              pointerEvents: "none",
            }}
          >
            <circle cx="260" cy="260" r="238" fill="none" stroke="rgba(11,93,59,.1)" strokeWidth="1.4" />
            <motion.circle
              cx="260"
              cy="260"
              r="238"
              fill="none"
              stroke="#0B5D3B"
              strokeWidth="2.4"
              strokeLinecap="round"
              transform="rotate(-90 260 260)"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 0.78 }}
              viewport={{ once: true }}
              transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
            />
            {[...Array(48)].map((_, i) => {
              const a = (i / 48) * Math.PI * 2 - Math.PI / 2;
              const R1 = i / 48 <= 0.78 ? 224 : 228;
              return (
                <line
                  key={i}
                  x1={260 + Math.cos(a) * R1}
                  y1={260 + Math.sin(a) * R1}
                  x2={260 + Math.cos(a) * 232}
                  y2={260 + Math.sin(a) * 232}
                  stroke={i / 48 <= 0.78 ? "#0B5D3B" : "rgba(20,35,28,.18)"}
                  strokeWidth={i % 8 === 0 ? 2 : 1}
                  opacity={i / 48 <= 0.78 ? 0.55 : 1}
                />
              );
            })}
          </svg>

          <div style={{ position: "relative" }}>
            <div className="eyebrow" style={{ color: "var(--muted-on-light)", marginBottom: 18 }}>
              {uiText(lang, "VIABILITY_CONTEXT")}
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(120px, 22vw, 300px)",
                lineHeight: 0.9,
                fontWeight: 480,
                fontVariationSettings: '"opsz" 144',
                letterSpacing: "-0.04em",
                color: "var(--forest)",
              }}
            >
              <AnimatedNumber value={78} duration={2.2} format={(n) => String(Math.round(n))} />
            </div>
            <div
              className="mono-num"
              style={{ fontSize: "clamp(18px,2vw,28px)", color: "rgba(20,35,28,.4)", marginTop: -8 }}
            >
              / 100
            </div>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 1.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ width: 64, height: 2, background: "var(--gold)", margin: "26px auto 18px" }}
            />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div className="body-ui" style={{ fontSize: 13, letterSpacing: ".34em", color: "var(--charcoal)" }}>
                {uiText(lang, "GOOD_POTENTIAL_LABEL").toUpperCase()}
              </div>
              <DataConfidenceBadge status="estimate" />
            </div>
          </div>
        </div>

        {/* ── factor ledger ── */}
        <div
          className="viability-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            borderTop: "1px solid var(--line-on-light)",
            borderLeft: "1px solid var(--line-on-light)",
          }}
        >
          {METRICS.map((m, i) => (
            <motion.div
              key={m.label}
              data-cursor="node"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="vcell"
              style={{
                borderRight: "1px solid var(--line-on-light)",
                borderBottom: "1px solid var(--line-on-light)",
                padding: "clamp(20px, 2.6vw, 36px)",
                display: "flex",
                alignItems: "center",
                gap: 20,
                background: "transparent",
                transition: "background .45s ease",
              }}
            >
              <Gauge v={m.v} warn={(m as any).warn} />
              <div>
                <div className="body-ui" style={{ fontSize: 10, color: "var(--muted-on-light)" }}>
                  {DATA[lang]?.[m.label] ?? m.label}
                </div>
                <div
                  className="mono-num"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(30px, 3vw, 44px)",
                    color: (m as any).warn ? "#B96A1F" : "var(--text-dark)",
                    lineHeight: 1.15,
                  }}
                >
                  {m.v}
                </div>
                <div className="vnote body-ui" style={{ fontSize: 9.5, letterSpacing: ".06em", color: "rgba(20,35,28,.42)", textTransform: "none" }}>
                  {tdyn(lang as UiLang, m.note)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div style={{ marginTop: 26 }}>
          <DataSourceLabel
            status="estimate"
            note={uiText(lang, "COMPOSITE_MODEL")}
          />
        </div>
      </div>
    </section>
  );
}
