"use client";

import { useState } from "react";
import { PinnedCrossFade } from "../scroll-story/ScrollStory";
import { SectionLabel } from "../primitives/SectionLabel";
import { DataConfidenceBadge } from "../data-source/DataConfidenceBadge";
import { VideoBackground } from "../media/VideoBackground";
import { MEDIA } from "@/lib/media";
import { useUiLang } from "@/lib/landing-strings";
import { uiText } from "@/lib/ui-strings";

export function FinancialStory() {
  const lang = useUiLang();
  const [progress, setProgress] = useState(0);

  const header = (
    <div style={{ textAlign: "left" }}>
      <SectionLabel index="08" title="THE MONEY, MADE VISIBLE" dark>
        <DataConfidenceBadge status="demo" dark />
      </SectionLabel>
    </div>
  );

  const footerContent = (
    <div style={{ textAlign: "center" }}>
      <span className="body-ui" style={{ fontSize: 9, letterSpacing: ".18em", color: "rgba(237,234,223,.42)" }}>
        {uiText(lang, "ILLUSTRATIVE_CALCULATION")}
      </span>
    </div>
  );

  // viewport background: subtle video + flow lines
  const viewportBg = (
    <>
      <div style={{ position: "absolute", inset: 0, opacity: 0.06, pointerEvents: "none" }}>
        <VideoBackground
          sources={[MEDIA.sunriseCountryside.mp4, MEDIA.sunriseCountryside.fallback]}
          opacity={1}
          filter="saturate(.4) brightness(.85)"
          overlay="linear-gradient(180deg, rgba(7,26,20,.75), rgba(7,26,20,.9))"
        />
      </div>
      <svg aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.12 }}>
        {[180, 420, 660, 900].map((y) => (
          <path
            key={y}
            d={`M -20 ${y} C 300 ${y - 60}, 700 ${y + 60}, 1020 ${y}`}
            fill="none"
            stroke="rgba(169,195,174,.18)"
            strokeWidth={1}
            strokeDasharray="4 14"
          />
        ))}
      </svg>
    </>
  );

  return (
    <PinnedCrossFade
      id="finance"
      background="#071A14"
      viewportBg={viewportBg}
      onProgress={setProgress}
      header={header}
      footer={progress > 0.78 ? footerContent : null}
    >
      {/* Stage 1 — ₹1,00,000 */}
      <div style={{ textAlign: "center" }}>
        <div className="mono-num" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(56px, 10vw, 148px)", lineHeight: 1, letterSpacing: "-0.03em", color: "var(--text-light)", whiteSpace: "nowrap" }}>
          ₹1,00,000
        </div>
        <div className="eyebrow" style={{ marginTop: 18, color: "var(--gold)" }}>{uiText(lang, "YOUR_MARGIN")}</div>
        <p className="body-lg" style={{ marginTop: 12, color: "var(--muted-on-dark)", maxWidth: 360, marginInline: "auto", textAlign: "center", fontSize: 15 }}>
          {uiText(lang, "MARGIN_FAMILY")}
        </p>
      </div>

      {/* Stage 2 — ₹10,00,000 */}
      <div style={{ textAlign: "center" }}>
        <div className="mono-num" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(56px, 10vw, 148px)", lineHeight: 1, letterSpacing: "-0.03em", color: "var(--text-light)", whiteSpace: "nowrap" }}>
          ₹10,00,000
        </div>
        <div className="eyebrow" style={{ marginTop: 18, color: "var(--gold)" }}>{uiText(lang, "PROJECT_COST")}</div>
        <p className="body-lg" style={{ marginTop: 12, color: "var(--muted-on-dark)", maxWidth: 380, marginInline: "auto", textAlign: "center", fontSize: 15 }}>
          {uiText(lang, "DAIRY_UNIT")}
        </p>
      </div>

      {/* Stage 3 — ₹9,00,000 */}
      <div style={{ textAlign: "center" }}>
        <div className="mono-num" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(56px, 10vw, 148px)", lineHeight: 1, letterSpacing: "-0.03em", color: "var(--text-light)", whiteSpace: "nowrap" }}>
          ₹9,00,000
        </div>
        <div className="eyebrow" style={{ marginTop: 18, color: "var(--gold)" }}>{uiText(lang, "POTENTIAL_LOAN")}</div>
        <p className="body-lg" style={{ marginTop: 12, color: "var(--muted-on-dark)", maxWidth: 360, marginInline: "auto", textAlign: "center", fontSize: 15 }}>
          {uiText(lang, "FINANCING_COVERS")}
        </p>
      </div>

      {/* Stage 4 — Funding split donut */}
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(18px, 3vw, 44px)", flexWrap: "wrap" }}>
          <svg width={164} height={164} viewBox="0 0 164 164" aria-hidden>
            <g transform="translate(82,82) rotate(-90)">
              <circle r={74} fill="none" stroke="rgba(237,234,223,.1)" strokeWidth={10} />
              <circle
                r={74}
                fill="none"
                stroke="#C8912D"
                strokeWidth={10}
                strokeDasharray={`${2 * Math.PI * 74 * (progress > 0.5 ? 0.9 : 0)} ${2 * Math.PI * 74}`}
                style={{ transition: "stroke-dasharray .6s ease" }}
              />
              <circle
                r={74}
                fill="none"
                stroke="#E3B75B"
                strokeWidth={10}
                strokeDasharray={`${2 * Math.PI * 74 * 0.1} ${2 * Math.PI * 74}`}
                transform="rotate(324)"
                opacity={progress > 0.62 ? 1 : 0}
                style={{ transition: "opacity .5s ease" }}
              />
              <text textAnchor="middle" dy="5" fontSize="15" fill="#F3EFE2" className="mono-num" transform="rotate(90)">
                10 : 90
              </text>
            </g>
          </svg>
          <div style={{ textAlign: "left", display: "grid", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 10, height: 10, background: "#E3B75B", borderRadius: 2 }} />
              <span className="body-ui" style={{ fontSize: 10.5, color: "var(--text-light)" }}>{uiText(lang, "BENEFICIARY").toUpperCase()} · ₹1,00,000 · 10%</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 10, height: 10, background: "#C8912D", borderRadius: 2 }} />
              <span className="body-ui" style={{ fontSize: 10.5, color: "var(--text-light)" }}>{uiText(lang, "INSTITUTIONAL_FINANCING").toUpperCase()} · ₹9,00,000 · 90%</span>
            </div>
          </div>
        </div>
      </div>
    </PinnedCrossFade>
  );
}
