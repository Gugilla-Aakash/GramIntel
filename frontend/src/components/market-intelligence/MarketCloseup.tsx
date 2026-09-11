"use client";

import { motion } from "framer-motion";
import { MEDIA, PHOTOS } from "@/lib/media";
import { demoData } from "@/lib/demo-data";
import { CinematicMedia } from "../media/CinematicMedia";
import { VideoBackground } from "../media/VideoBackground";
import { DataConfidenceBadge } from "../data-source/DataConfidenceBadge";
import { DataSourceLabel } from "../data-source/DataSourceLabel";
import { SectionLabel } from "../primitives/SectionLabel";
import { AnimatedNumber } from "../primitives/AnimatedNumber";
import { Icon } from "../icons";
import { useUiLang } from "@/lib/landing-strings";
import { uiText } from "@/lib/ui-strings";

const STATS = [
  {
    icon: Icon.Users,
    label: "ESTIMATED CONSUMERS",
    value: <AnimatedNumber value={demoData.market.estimatedConsumers.value} duration={1.8} format={(n) => n.toLocaleString("en-IN")} />,
    status: "estimate" as const,
    sub: "10 km radius",
  },
  {
    icon: Icon.Store,
    label: "SIMILAR BUSINESSES",
    value: <AnimatedNumber value={demoData.market.similarBusinesses.value} duration={1.4} />,
    status: "demo" as const,
    sub: "location layer",
  },
  {
    icon: Icon.Wallet,
    label: "PRICE RANGE",
    value: <>₹{demoData.market.priceRangeInr.value[0]}–{demoData.market.priceRangeInr.value[1]}<span style={{ fontSize: 14, opacity: 0.6 }}> /kg</span></>,
    status: "estimate" as const,
    sub: "value-added dairy",
  },
  {
    icon: Icon.Target,
    label: "OPPORTUNITY SCORE",
    value: <AnimatedNumber value={demoData.opportunity.score.value} duration={1.6} format={(n) => `${Math.round(n)} / 100`} />,
    status: "estimate" as const,
    sub: demoData.opportunity.grade,
    gold: true,
  },
];

/**
 * Editorial close-up after the map documentary:
 * real market footage on the left, live intelligence on the right.
 */
export function MarketCloseup() {
  const lang = useUiLang();
  return (
    <section id="market-closeup" className="section-pad" style={{ background: "var(--cream)" }}>
      <div className="shell">
        <SectionLabel index="05" title="MARKET INTELLIGENCE · CLOSE-UP" />

        <div
          className="closeup-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr .95fr",
            gap: "clamp(28px, 4vw, 72px)",
            alignItems: "center",
          }}
        >
          {/* ── the real market ── */}
          <CinematicMedia
            src={PHOTOS.vegetableVendor.src}
            alt={PHOTOS.vegetableVendor.alt}
            fallback={<VideoBackground sources={[MEDIA.fabricMarket.mp4]} opacity={1} />}
            height="clamp(400px, 74vh, 700px)"
          >
            {/* floating analytical panel — data over reality */}
            <motion.div
              data-float="panel"
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "absolute",
                right: "clamp(-18px, -1.5vw, -12px)",
                top: "clamp(24px, 6vh, 56px)",
                width: 210,
                background: "rgba(252,251,247,.94)",
                border: "1px solid rgba(20,35,28,.14)",
                borderRadius: 14,
                padding: "16px 18px",
                boxShadow: "0 22px 60px rgba(7,26,20,.28)",
                backdropFilter: "blur(6px)",
              }}
            >
              <div className="body-ui" style={{ fontSize: 8, letterSpacing: ".26em", color: "var(--muted-on-light)" }}>
                {uiText(lang, "LOCAL_DEMAND")}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 34,
                  color: "var(--forest)",
                  lineHeight: 1.15,
                }}
                className="mono-num"
              >
                +18%
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <span style={{ color: "#9A6E1F", display: "inline-flex" }}>
                  <Icon.Trend size={12} />
                </span>
                <span className="body-ui" style={{ fontSize: 7.5, letterSpacing: ".2em", color: "#9A6E1F" }}>
                {uiText(lang, "AI_ESTIMATE")}
                </span>
              </div>
              <div style={{ height: 1, background: "var(--line-on-light)", margin: "12px 0" }} />
              <div style={{ fontSize: 11, color: "var(--muted-on-light)", lineHeight: 1.5 }}>
                {uiText(lang, "MILK_RISING")}
              </div>
            </motion.div>
          </CinematicMedia>

          {/* ── live intelligence ledger ── */}
          <div>
            <h3 className="display-m" style={{ color: "var(--text-dark)", maxWidth: 420 }}>
              {uiText(lang, "MARKET_QUANTIFIED")}
              <span className="serif-i" style={{ color: "var(--forest)" }}>
                quantified.
              </span>
            </h3>
            <p className="body-lg" style={{ marginTop: 14, color: "var(--muted-on-light)", maxWidth: 420 }}>
              {uiText(lang, "MARKET_BODY")}
            </p>

            <div style={{ display: "grid", gap: 0, marginTop: "clamp(22px, 4vh, 40px)" }}>
              {STATS.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.09 }}
                  style={{
                    borderTop: "1px solid var(--line-on-light)",
                    padding: "17px 2px",
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto auto",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <span style={{ color: s.gold ? "#9A6E1F" : "var(--forest)", display: "inline-flex" }}>
                    {s.icon({ size: 17 })}
                  </span>
                  <span>
                    <span className="body-ui" style={{ fontSize: 9.5, color: "rgba(20,35,28,.55)", display: "block" }}>
                      {uiText(lang, s.label === "ESTIMATED CONSUMERS" ? "ESTIMATED_CONSUMERS" : s.label === "SIMILAR BUSINESSES" ? "SIMILAR_BUSINESSES" : s.label === "PRICE RANGE" ? "PRICE_RANGE" : "OPPORTUNITY_SCORE")}
                    </span>
                    <span style={{ fontSize: 11, color: "rgba(20,35,28,.42)" }}>{s.sub === "10 km radius" ? uiText(lang, "RADIUS_10KM") : s.sub === "location layer" ? uiText(lang, "LOCATION_LAYER") : s.sub === "value-added dairy" ? uiText(lang, "VALUE_ADDED_DAIRY") : uiText(lang, "GOOD_POTENTIAL_LABEL")}</span>
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(22px, 2.2vw, 30px)",
                      color: s.gold ? "#9A6E1F" : "var(--text-dark)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.value}
                  </span>
                  <DataConfidenceBadge status={s.status} />
                </motion.div>
              ))}
            </div>

            <div style={{ marginTop: 18 }}>
              <DataSourceLabel
                status="demo"
                note="Simulated for prototype"
                updated="Demo"
                dark={false}
              />
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
