"use client";

import { useMemo, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { mulberry32 } from "@/lib/utils";
import { SectionLabel } from "../primitives/SectionLabel";
import { SplitWords } from "../primitives/SplitText";
import { DataConfidenceBadge } from "../data-source/DataConfidenceBadge";
import { DataSourceLabel } from "../data-source/DataSourceLabel";
import { useUiLang } from "@/lib/landing-strings";
import { uiText } from "@/lib/ui-strings";

const VB = 600;
const N = 44;

interface Pt {
  sx: number;
  sy: number;
  ox: number;
  oy: number;
  cat: number; // 0 demand · 1 supply gap · 2 competition · 3 signal
}

function buildPoints(): Pt[] {
  const rnd = mulberry32(4207);
  // cluster anchors in the "organized" state
  const anchors = [
    { x: 205, y: 215 },
    { x: 392, y: 292 },
    { x: 296, y: 428 },
  ];
  return Array.from({ length: N }, (_, i) => {
    const a = anchors[i % 3];
    const ang = rnd() * Math.PI * 2;
    const rad = 24 + rnd() * (i % 3 === 2 ? 96 : 64);
    return {
      sx: 70 + rnd() * (VB - 140),
      sy: 70 + rnd() * (VB - 140),
      ox: a.x + Math.cos(ang) * rad,
      oy: a.y + Math.sin(ang) * rad * 0.86,
      cat: i % 3,
    };
  });
}

const CAT_COLORS = ["#0B5D3B", "#C8912D", "#47705C"];

function ChaosDot({
  pt,
  i,
  p,
}: {
  pt: Pt;
  i: number;
  p: MotionValue<number>;
}) {
  const t0 = 0.16 + (i % 11) * 0.014;
  const t1 = t0 + 0.36;
  const cx = useTransform(p, [t0, t1], [pt.sx, pt.ox]);
  const cy = useTransform(p, [t0, t1], [pt.sy, pt.oy]);
  const opacity = useTransform(p, [i * 0.006, i * 0.006 + 0.08], [0, 1]);
  const fill = useTransform(
    p,
    [0.62, 0.84],
    ["#AFA893", CAT_COLORS[pt.cat]]
  );
  const r = useTransform(p, [0.62, 0.84], [3, pt.cat === 0 ? 4.6 : 3.4]);
  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      opacity={opacity}
      initial={{ opacity: 0 }}
    />
  );
}

export function ProblemIntelligence() {
  const lang = useUiLang();
  const ref = useRef<HTMLDivElement>(null);
  const points = useMemo(buildPoints, []);
  const { scrollYProgress: p } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  /* connection web draws late */
  const webDraw = useTransform(p, [0.58, 0.86], [0, 1]);
  /* cluster labels */
  const labelOp = useTransform(p, [0.84, 0.92], [0, 1]);
  /* final stamp */
  const stampScale = useTransform(p, [0.88, 0.97], [0.4, 1]);
  const stampOp = useTransform(p, [0.88, 0.95], [0, 1]);
  /* chaos-era ghost labels fade away */
  const ghostsOp = useTransform(p, [0.05, 0.22], [1, 0]);

  const GHOSTS = [
    { t: "Kirana store?", x: 120, y: 150 },
    { t: "Dairy?", x: 400, y: 130 },
    { t: "Tailoring?", x: 470, y: 420 },
    { t: "Agri-trader?", x: 110, y: 460 },
    { t: "Mobile repair?", x: 300, y: 80 },
  ];

  return (
    <section
      id="problem"
      style={{
        background: "var(--cream)",
        paddingBlock: "clamp(90px, 14vh, 170px)",
      }}
    >
      <div className="shell">
        <SectionLabel index="02" title="THE PROBLEM" />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,.9fr) minmax(0,1.1fr)",
            gap: "clamp(32px, 5vw, 90px)",
          }}
          className="problem-grid"
        >
          {/* ── sticky statement ── */}
          <div>
            <div style={{ position: "sticky", top: "22vh" }}>
              <h3
                className="display-m"
                style={{ fontSize: "clamp(30px, 3.4vw, 52px)", maxWidth: 520 }}
              >
                <SplitWords text={uiText(lang, "PROBLEM_HEAD_A")} stagger={0.04} />{" "}
                <span
                  className="serif-i"
                  style={{ color: "var(--gold)", whiteSpace: "nowrap" }}
                >
                  <SplitWords text={uiText(lang, "PROBLEM_HEAD_B")} stagger={0.045} />
                </span>{" "}
                <SplitWords text={uiText(lang, "PROBLEM_HEAD_C")} stagger={0.04} delay={0.15} />
              </h3>
              <motion.p
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="body-lg"
                style={{
                  marginTop: 28,
                  maxWidth: 420,
                  color: "var(--muted-on-light)",
                }}
              >
                {uiText(lang, "PROBLEM_BODY")}
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.9, duration: 1 }}
                className="body-ui"
                style={{ marginTop: 40, fontSize: 10.5, color: "rgba(20,35,28,.45)" }}
              >
                {uiText(lang, "SCROLL_SIGNAL")}
              </motion.div>
            </div>
          </div>

          {/* ── scroll-driven visual ── */}
          <div ref={ref} style={{ height: "340vh", position: "relative" }}>
            <div style={{ position: "sticky", top: "10vh" }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                <DataConfidenceBadge status="demo" />
              </div>
              <svg
                viewBox={`0 0 ${VB} ${VB}`}
                role="img"
                aria-label="Scattered market data organizing into clear clusters, ending in a decision signal"
                style={{ width: "100%", height: "auto", overflow: "visible" }}
              >
                {/* frame ticks */}
                <rect x="0.5" y="0.5" width={VB - 1} height={VB - 1} fill="none" stroke="var(--line-on-light)" />
                {[150, 300, 450].map((v) => (
                  <g key={v} stroke="var(--line-on-light)" strokeDasharray="1 6">
                    <line x1={v} y1="0" x2={v} y2={VB} />
                    <line x1="0" y1={v} x2={VB} y2={v} />
                  </g>
                ))}

                {/* ghost uncertainty labels (chaos phase) */}
                <motion.g opacity={ghostsOp}>
                  {GHOSTS.map((g, i) => (
                    <text
                      key={g.t}
                      x={g.x}
                      y={g.y}
                      className="body-ui"
                      fontSize={11}
                      fill="#8A8578"
                      style={{ animation: `ghost-blink 3.4s ${i * 0.7}s infinite` }}
                    >
                      {g.t}
                    </text>
                  ))}
                </motion.g>

                {/* organized web */}
                <motion.g stroke="#47705C" strokeWidth={1} opacity={0.5}>
                  <motion.line x1={205} y1={215} x2={392} y2={292} style={{ pathLength: webDraw }} />
                  <motion.line x1={392} y1={292} x2={296} y2={428} style={{ pathLength: webDraw }} />
                  <motion.line x1={296} y1={428} x2={205} y2={215} style={{ pathLength: webDraw }} />
                </motion.g>

                {/* the dots */}
                {points.map((pt, i) => (
                  <ChaosDot key={i} pt={pt} i={i} p={p} />
                ))}

                {/* cluster labels */}
                <motion.g opacity={labelOp} className="body-ui" fontSize={10} fill="rgba(20,35,28,.72)">
                  <text x={148} y={172}>{uiText(lang, "DEMAND")}</text>
                  <text x={352} y={250}>{uiText(lang, "SUPPLY_GAP")}</text>
                  <text x={268} y={486}>{uiText(lang, "COMPETITION_LABEL")}</text>
                </motion.g>

                {/* decision stamp */}
                <motion.g
                  initial={false}
                  style={{
                    opacity: stampOp,
                    scale: stampScale,
                    originX: "50%",
                    originY: "38%",
                  }}
                >
                  <circle cx={300} cy={228} r={54} fill="none" stroke="#C8912D" strokeWidth={1} opacity={0.5} />
                  <rect x={180} y={196} width={240} height={40} rx={20} fill="#071A14" />
                  <circle cx={202} cy={216} r={3.4} fill="#E3B75B">
                    <animate attributeName="opacity" values="1;.2;1" dur="1.6s" repeatCount="indefinite" />
                  </circle>
                  <text x={220} y={221} textAnchor="start" className="body-ui" fontSize={10} fill="#F3EFE2" letterSpacing="0.12em">
                    DECISION SIGNAL FOUND
                  </text>
                </motion.g>
              </svg>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
