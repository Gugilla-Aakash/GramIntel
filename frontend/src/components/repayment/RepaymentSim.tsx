"use client";

import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { formatINR } from "@/lib/utils";
import { SectionLabel } from "../primitives/SectionLabel";
import { DataConfidenceBadge } from "../data-source/DataConfidenceBadge";
import { DataSourceLabel } from "../data-source/DataSourceLabel";
import { calcEMI } from "@/lib/map-data";
import { demoData } from "@/lib/demo-data";
import { useMediaQuery, useIsMobile } from "@/lib/hooks";
import { useUiLang } from "@/lib/landing-strings";
import { uiText } from "@/lib/ui-strings";

const EMI = Math.round(calcEMI(demoData.finance.loan, demoData.finance.interestPct, demoData.finance.tenureYears * 12));
const REVENUE = demoData.repayment.monthlyRevenue;
const COSTS = demoData.repayment.operatingCosts;
const SURPLUS = REVENUE - COSTS;
const BUFFER = SURPLUS - EMI;
const TOTAL_INTEREST = EMI * 84 - demoData.finance.loan;
const TOTAL_BUFFER_7Y = BUFFER * 84;

const FOREST = "#0B5D3B";
const COLORS = {
  revenue: FOREST,
  costs: "#C97A2B",
  surplus: "#A9C3AE",
  emi: "#8A6A2F",
  buffer: "#E3B75B",
};
const LINE_LIGHT = "rgba(20,35,28,0.08)";

type Segment = { key: string; label: string; value: number; color: string; sub: string };

const SEGMENTS: Segment[] = [
  { key: "revenue", label: "Revenue", value: REVENUE, color: COLORS.revenue, sub: "inflow" },
  { key: "costs", label: "Costs", value: COSTS, color: COLORS.costs, sub: "operating" },
  { key: "surplus", label: "Surplus", value: SURPLUS, color: COLORS.surplus, sub: "before EMI" },
  { key: "emi", label: "EMI", value: EMI, color: COLORS.emi, sub: "loan" },
  { key: "buffer", label: "Buffer", value: BUFFER, color: COLORS.buffer, sub: "stays" },
];

function polarPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const x0 = cx + Math.cos(toRad(a0)) * r;
  const y0 = cy + Math.sin(toRad(a0)) * r;
  const x1 = cx + Math.cos(toRad(a1)) * r;
  const y1 = cy + Math.sin(toRad(a1)) * r;
  const largeArc = a1 - a0 > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${largeArc} 1 ${x1} ${y1} Z`;
}

function PolarAreaChart({ p, prefersReduced }: { p: ReturnType<typeof useScroll>["scrollYProgress"]; prefersReduced: boolean }) {
  const lang = useUiLang();
  const [explained, setExplained] = useState("");
  const [loadingLang, setLoadingLang] = useState<string | null>(null);
  const explain = async (language: "hi" | "te") => {
    setLoadingLang(language);
    try {
      const r = await fetch("/api/explain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lang: language }) });
      const j = await r.json();
      setExplained(j.text);
    } finally {
      setLoadingLang(null);
    }
  };
  const MAX = REVENUE;
  const R = 112;
  const CX = 190;
  const CY = 190;
  const step = 360 / SEGMENTS.length; // 72
  const startOffset = -90; // start at top

  // scroll-driven scales per segment
  const s0 = useTransform(p, [0.08, 0.22], prefersReduced ? [1, 1] : [0, 1]);
  const s1 = useTransform(p, [0.22, 0.36], prefersReduced ? [1, 1] : [0, 1]);
  const s2 = useTransform(p, [0.36, 0.50], prefersReduced ? [1, 1] : [0, 1]);
  const s3 = useTransform(p, [0.50, 0.64], prefersReduced ? [1, 1] : [0, 1]);
  const s4 = useTransform(p, [0.64, 0.78], prefersReduced ? [1, 1] : [0, 1]);
  const scales = [s0, s1, s2, s3, s4];
  const op0 = useTransform(p, [0.08, 0.16], prefersReduced ? [1, 1] : [0, 1]);
  const op1 = useTransform(p, [0.22, 0.30], prefersReduced ? [1, 1] : [0, 1]);
  const op2 = useTransform(p, [0.36, 0.44], prefersReduced ? [1, 1] : [0, 1]);
  const op3 = useTransform(p, [0.50, 0.58], prefersReduced ? [1, 1] : [0, 1]);
  const op4 = useTransform(p, [0.64, 0.72], prefersReduced ? [1, 1] : [0, 1]);
  const ops = [op0, op1, op2, op3, op4];

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: `1px solid ${LINE_LIGHT}`,
        borderRadius: 20,
        padding: "28px 24px 22px",
        boxShadow: "0 1px 3px rgba(20,35,28,0.04), 0 12px 36px rgba(20,35,28,0.06)",
        overflow: "visible",
      }}
    >
      <div className="body-ui" style={{ fontSize: 10, letterSpacing: ".16em", color: "rgba(20,35,28,0.36)", textAlign: "center", marginBottom: 14 }}>
        {uiText(lang, "MONTHLY_SPLIT")}
      </div>

      <svg viewBox="0 0 380 380" role="img" aria-label={uiText(lang, "CASH_FLOW_CHART")} style={{ width: "100%", height: "auto", overflow: "visible", display: "block" }}>
        {/* faint grid circles */}
        {[0.33, 0.66, 1].map((f) => (
          <circle key={f} cx={CX} cy={CY} r={R * f} fill="none" stroke="rgba(20,35,28,0.06)" strokeWidth={1} />
        ))}
        {/* radial grid lines */}
        {SEGMENTS.map((_, i) => {
          const a = startOffset + i * step;
          const x = CX + Math.cos((a * Math.PI) / 180) * R;
          const y = CY + Math.sin((a * Math.PI) / 180) * R;
          return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(20,35,28,0.06)" strokeWidth={1} />;
        })}

        {/* segments */}
        {SEGMENTS.map((seg, i) => {
          const a0 = startOffset + i * step;
          const a1 = a0 + step;
          const r = (seg.value / MAX) * R;
          const d = polarPath(CX, CY, r, a0, a1);
          const midA = (a0 + a1) / 2;
          const labelR = R + 26;
          const lx = CX + Math.cos((midA * Math.PI) / 180) * labelR;
          const ly = CY + Math.sin((midA * Math.PI) / 180) * labelR;
          const cos = Math.cos((midA * Math.PI) / 180);
          const anchor = cos > 0.35 ? "start" : cos < -0.35 ? "end" : "middle";
          const labelColor = seg.key === "surplus" ? "#2D4A32" : seg.key === "buffer" ? "#7A5A08" : seg.color;
          return (
            <g key={seg.key}>
              <motion.path
                d={d}
                fill={seg.color}
                stroke="#FFFFFF"
                strokeWidth={2}
                style={{ scale: scales[i] as any, opacity: ops[i] as any, transformOrigin: `${CX}px ${CY}px` }}
              />
              {/* value label outside — non-overlapping */}
              <motion.g style={{ opacity: ops[i] as any }}>
                <text x={lx} y={ly - 2} textAnchor={anchor} dominantBaseline="middle" fontSize={10} className="mono-num" fontWeight={700} fill={labelColor}>
                  {formatINR(seg.value)}
                </text>
                <text x={lx} y={ly + 10} textAnchor={anchor} fontSize={7} className="body-ui" fill="rgba(20,35,28,0.46)" letterSpacing="0.10em">
                  {uiText(lang, seg.key.toUpperCase()).toUpperCase()}
                </text>
              </motion.g>
            </g>
          );
        })}

        {/* center badge — buffer highlight */}
        <g>
          <circle cx={CX} cy={CY} r={42} fill="#FFFFFF" stroke="rgba(20,35,28,0.08)" strokeWidth={1} />
          <circle cx={CX} cy={CY} r={38} fill={FOREST} />
          <text x={CX} y={CY - 6} textAnchor="middle" fontSize={11} className="mono-num" fontWeight={800} fill="#FFFFFF">
            {formatINR(BUFFER)}
          </text>
          <text x={CX} y={CY + 10} textAnchor="middle" fontSize={7} className="body-ui" fill="rgba(255,255,255,0.78)" letterSpacing="0.14em">
            {uiText(lang, "BUFFER").toUpperCase()}
          </text>
          <motion.circle cx={CX} cy={CY} r={42} fill="none" stroke={FOREST} strokeWidth={1} opacity={0.14} animate={prefersReduced ? undefined : { scale: [1, 1.08, 1] }} transition={prefersReduced ? undefined : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: `${CX}px ${CY}px` }} />
        </g>
      </svg>

      {/* legend — simple, visible */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 14px", marginTop: 14 }}>
        {SEGMENTS.map((s) => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, display: "inline-block", flexShrink: 0, border: s.key === "surplus" ? "1px solid rgba(20,35,28,0.08)" : "none" }} />
            <span className="body-ui" style={{ fontSize: 10, letterSpacing: ".08em", color: "rgba(20,35,28,0.62)", textTransform: "none" }}>
              {uiText(lang, s.key.toUpperCase())}
            </span>
            <span className="mono-num" style={{ fontSize: 10, fontWeight: 700, color: "#14231c", marginLeft: "auto" }}>
              {formatINR(s.value)}
            </span>
          </div>
        ))}
      </div>
      <div style={{display:"flex", gap:8, justifyContent:"center", marginTop:10}}>
        <button onClick={() => explain("hi")} disabled={!!loadingLang} className="body-ui" style={{fontSize:9, padding:"6px 12px", borderRadius:999, background: loadingLang==="hi" ? "var(--forest)" : "#FFFFFF", color: loadingLang==="hi" ? "#FFFFFF" : "var(--text-dark)", border:"1px solid rgba(20,35,28,0.12)", cursor:"pointer"}}>हि {uiText(lang, "HINDI")}</button>
        <button onClick={() => explain("te")} disabled={!!loadingLang} className="body-ui" style={{fontSize:9, padding:"6px 12px", borderRadius:999, background: loadingLang==="te" ? "var(--forest)" : "#FFFFFF", color: loadingLang==="te" ? "#FFFFFF" : "var(--text-dark)", border:"1px solid rgba(20,35,28,0.12)", cursor:"pointer"}}>తె {uiText(lang, "TELUGU")}</button>
      </div>
      {explained && <p className="body-ui" style={{fontSize:10, marginTop:8, textAlign:"center", color:"rgba(20,35,28,0.62)", textTransform:"none", letterSpacing:".02em"}}>{explained}</p>}
    </div>
  );
}

export function RepaymentSim() {
  const lang = useUiLang();
  const ref = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(0);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(p, "change", (v) => setStage(v < 0.18 ? 0 : v < 0.36 ? 1 : v < 0.54 ? 2 : v < 0.70 ? 3 : 4));

  const prefersReduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isMobile = useIsMobile();

  const l0 = useTransform(p, [0.06, 0.14], [0.15, 1]);
  const l1 = useTransform(p, [0.24, 0.32], [0.15, 1]);
  const l2 = useTransform(p, [0.38, 0.46], [0.15, 1]);
  const l3 = useTransform(p, [0.56, 0.64], [0.15, 1]);
  const l4 = useTransform(p, [0.70, 0.78], [0.15, 1]);
  const ledgerOps = [l0, l1, l2, l3, l4];

  const ledgerRows: Array<{ label: string; val: string; c: string; sub?: string; dot: string }> = [
    { label: uiText(lang, "MONTHLY_REVENUE"), val: "+ ₹85,000", c: FOREST, dot: COLORS.revenue, sub: undefined },
    { label: uiText(lang, "OPERATING_COSTS"), val: "− ₹57,000", c: "#8A4A14", dot: COLORS.costs, sub: uiText(lang, "INCLUDING_WORKING_CAPITAL", { amount: "₹14,500" }) },
    { label: uiText(lang, "GROSS_SURPLUS"), val: `+ ${formatINR(SURPLUS)}`, c: FOREST, dot: COLORS.surplus, sub: undefined },
    { label: uiText(lang, "LOAN_REPAYMENT"), val: `− ${formatINR(EMI * 3)}/qtr`, c: "#5A4318", dot: COLORS.emi, sub: `EMI ${formatINR(EMI)} ×3 · 84 ${uiText(lang, "MONTHS")}` },
    { label: uiText(lang, "NET_BUFFER"), val: `+ ${formatINR(BUFFER)}`, c: FOREST, dot: COLORS.buffer, sub: uiText(lang, "STAYS_WITH_YOU") },
  ];

  const verdictOp = useTransform(p, [0.78, 0.9], [0, 1]);
  const verdictScale = useTransform(p, [0.78, 0.92], [0.6, 1]);

  return (
    <section id="repayment" className="section-pad" style={{ background: "var(--cream)" }}>
      <div className="shell">
        <SectionLabel index="10" title="REPAYMENT SIMULATION">
          <DataConfidenceBadge status="demo" />
        </SectionLabel>

        <div style={{ maxWidth: 640 }}>
          <h2 className="display-m" style={{ color: "var(--text-dark)" }}>
            {uiText(lang, "REPAYMENT_QUESTION")}
          </h2>
          <p className="body-lg" style={{ marginTop: 14, color: "var(--muted-on-light)", maxWidth: 480 }}>
            {uiText(lang, "REPAYMENT_EXPLANATION")}
          </p>
        </div>

        <div ref={ref} style={{ height: prefersReduced ? "auto" : "300vh", position: "relative", marginTop: "clamp(28px, 5vh, 48px)" }}>
          <div
            style={{
              position: prefersReduced ? "relative" : "sticky",
              top: prefersReduced ? undefined : "calc(50vh - min(38vh, 360px))",
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "0.95fr 1.05fr",
              gap: "clamp(28px, 4vw, 56px)",
              alignItems: "center",
            }}
            className="repay-grid"
          >
            {/* LEFT — text */}
            <div>
              <div style={{ display: "grid", gap: 0 }}>
                {ledgerRows.map((r, i) => (
                  <motion.div
                    key={r.label}
                    initial={false}
                    style={{
                      opacity: prefersReduced ? 1 : (ledgerOps[i] as any),
                      borderTop: "1px solid var(--line-on-light)",
                      padding: "16px 2px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 14,
                      background: i === 4 ? "rgba(11,93,59,0.04)" : "transparent",
                      borderBottom: i === 4 ? "1px solid rgba(11,93,59,0.12)" : undefined,
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: r.dot, display: "inline-block", flexShrink: 0, border: r.dot === COLORS.surplus ? "1px solid rgba(20,35,28,0.08)" : "none" }} />
                      <span style={{ display: "grid", gap: r.sub ? 2 : 0 }}>
                        <span className="body-ui" style={{ fontSize: 11, color: i === 4 ? "rgba(11,93,59,0.88)" : "rgba(20,35,28,0.62)", fontWeight: i === 4 ? 700 : 500, letterSpacing: ".06em", textTransform: "none" }}>
                          {r.label}
                        </span>
                        {r.sub && <span className="body-ui" style={{ fontSize: 10, color: "rgba(20,35,28,0.42)", letterSpacing: ".04em", textTransform: "none" }}>{r.sub}</span>}
                      </span>
                    </span>
                    <span className="mono-num" style={{ fontSize: 16, color: r.c, fontWeight: i === 4 ? 800 : 700, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
                      {prefersReduced || i <= stage ? r.val : "—"}
                    </span>
                  </motion.div>
                ))}
              </div>

              <motion.div initial={false} style={{ opacity: prefersReduced ? 1 : (verdictOp as any), scale: prefersReduced ? 1 : (verdictScale as any), marginTop: 18, display: "inline-flex", alignItems: "center", gap: 10, border: "1px solid rgba(11,93,59,.18)", borderRadius: 999, padding: "10px 16px", background: "#FFFFFF", boxShadow: "0 4px 16px rgba(20,35,28,0.06)", originX: 0 }}>
                <span className="body-ui" style={{ fontSize: 10, letterSpacing: ".14em", color: "var(--charcoal)" }}>{uiText(lang, "REPAYMENT_HEALTH")}</span>
                <motion.span animate={prefersReduced ? undefined : { opacity: [1, 0.45, 1] }} transition={prefersReduced ? undefined : { duration: 2, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: 99, background: FOREST, display: "inline-block" }} />
                <span className="body-ui" style={{ fontSize: 11, letterSpacing: ".12em", color: FOREST, fontWeight: 700 }}>{uiText(lang, "SAFE")}</span>
              </motion.div>

              <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
                <p className="body-ui" style={{ fontSize: 10, color: "rgba(20,35,28,.42)", lineHeight: 1.6, textTransform: "none", letterSpacing: ".02em" }}>
                  {uiText(lang, "CALCULATION_NOTE", { emi: formatINR(EMI), quarterly: formatINR(EMI * 3), buffer: formatINR(BUFFER) })}
                </p>
                <DataSourceLabel status="demo" note={uiText(lang, "SIMULATED_DATA")} />
              </div>
            </div>

            {/* RIGHT — graph */}
            <div>
              <PolarAreaChart p={p} prefersReduced={prefersReduced} />
              <p className="body-ui" style={{ fontSize: 10, color: "rgba(20,35,28,0.38)", textAlign: "center", marginTop: 10, letterSpacing: ".06em", textTransform: "none" }}>
                {uiText(lang, "RADIUS_MONTHLY")}
              </p>
              <div className="body-ui" style={{ fontSize: 8, color: "rgba(20,35,28,0.42)", textAlign: "center", marginTop: 10, letterSpacing: ".06em" }}>
                {uiText(lang, "TERM_LOAN_NOTE", { amount: (EMI * 3).toLocaleString("en-IN") })}
              </div>
            </div>
          </div>
        </div>

        <motion.p initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="display-m serif-i" style={{ fontSize: "clamp(24px, 3vw, 40px)", color: "var(--forest)", marginTop: "clamp(36px, 7vh, 72px)", maxWidth: 640 }}>
          {uiText(lang, "FAMILY_BUFFER", { amount: formatINR(BUFFER) })}
        </motion.p>
      </div>
    </section>
  );
}
