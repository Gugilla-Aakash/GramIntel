"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { SectionLabel } from "../primitives/SectionLabel";
import { SplitLines } from "../primitives/SplitText";
import { MagneticButton } from "../primitives/MagneticButton";
import { useUiLang } from "@/lib/landing-strings";
import { uiText } from "@/lib/ui-strings";

type Route = "micro" | "term" | null;

export function SchemeRouter() {
  const lang = useUiLang();
  const ref = useRef<HTMLDivElement>(null);
  const [route, setRoute] = useState<Route>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  /* auto-decide once visible, until the visitor overrides */
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (!inView || touched) return;
    const t = setTimeout(() => setRoute("term"), 1800);
    return () => clearTimeout(t);
  }, [inView, touched]);

  const pick = (r: Exclude<Route, null>) => {
    setTouched(true);
    setRoute(r);
  };

  return (
    <section
      id="scheme-router"
      ref={ref}
      className="section-pad"
      style={{ background: "linear-gradient(180deg,#071A14,#0B241C)" }}
    >
      <div className="shell">
        <SectionLabel index="09" title="SCHEME ROUTING" dark />

        <div style={{ maxWidth: 720 }}>
          <h2 className="display-m" style={{ color: "var(--text-light)" }}>
            <SplitLines
              lines={[
                <>{uiText(lang, "SCHEME_QUESTION")}</>,
                <>
                  {uiText(lang, "THE")} {" "}
                  <span className="serif-i" style={{ color: "var(--gold-bright)" }}>
                    {uiText(lang, "RIGHT_SCHEME")}
                  </span>{" "}
                  {uiText(lang, "LIGHTS_UP")}
                </>,
              ]}
              stagger={0.14}
            />
          </h2>
        </div>

        {/* selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBlock: "clamp(28px,5vh,48px)" }}
        >
          <MagneticButton
            cursor="button"
            strength={0.25}
            onClick={() => pick("micro")}
            style={{
              borderRadius: 999,
              padding: "14px 26px",
              border: `1px solid ${route === "micro" ? "rgba(227,183,91,.75)" : "var(--line-on-dark)"}`,
              background: route === "micro" ? "rgba(200,145,45,.1)" : "transparent",
              transition: "border .4s, background .4s",
            }}
          >
            <span
              className="body-ui"
              style={{ fontSize: 11, color: route === "micro" ? "var(--gold-bright)" : "rgba(237,234,223,.65)" }}
            >
              {uiText(lang, "MICRO_NEED")}
            </span>
          </MagneticButton>
          <MagneticButton
            cursor="button"
            strength={0.25}
            onClick={() => pick("term")}
            style={{
              borderRadius: 999,
              padding: "14px 26px",
              border: `1px solid ${route === "term" ? "rgba(227,183,91,.75)" : "var(--line-on-dark)"}`,
              background: route === "term" ? "rgba(200,145,45,.1)" : "transparent",
              transition: "border .4s, background .4s",
            }}
          >
            <span
              className="body-ui"
              style={{ fontSize: 11, color: route === "term" ? "var(--gold-bright)" : "rgba(237,234,223,.65)" }}
            >
              {uiText(lang, "TERM_NEED")}
            </span>
          </MagneticButton>
        </motion.div>

        {/* ── the tree ── */}
        <svg viewBox="0 0 1000 460" role="img" aria-label={uiText(lang, "SCHEME_ROUTER_ARIA")} style={{ width: "100%", height: "auto", overflow: "visible" }}>
          {/* root */}
          <rect x={400} y={18} width={200} height={46} rx={23} fill="#F3EFE2" />
          <text x={500} y={46} textAnchor="middle" fontSize={11} className="body-ui" fill="#071A14" letterSpacing="2">
            {uiText(lang, "PROJECT_COST")}
          </text>

          {/* trunk */}
          <motion.path
            d="M 500 64 L 500 150"
            fill="none"
            stroke="rgba(169,195,174,.5)"
            strokeWidth={1.6}
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
          />

          {/* junction */}
          <motion.circle
            cx={500}
            cy={172}
            r={26}
            fill={route ? "#C8912D" : "#071A14"}
            stroke={route ? "#E3B75B" : "rgba(169,195,174,.5)"}
            strokeWidth={1.6}
            initial={false}
            animate={{ scale: route ? [1, 1.12, 1] : 1 }}
            transition={{ duration: 0.7 }}
            style={{ originX: "50%", originY: `${(172 / 460) * 100}%` } as any}
          />
          <text x={500} y={177} textAnchor="middle" fontSize={13} className="mono-num" fill={route ? "#071A14" : "#F3EFE2"}>
            ₹
          </text>
          <text x={500} y={222} textAnchor="middle" fontSize={10} className="body-ui" fill="rgba(237,234,223,.55)">
            {uiText(lang, "PROJECT_THRESHOLD")}
          </text>

          {/* branches */}
          {(
            [
              {
                id: "micro",
                d: "M 468 186 C 375 222, 315 242, 260 300",
                lx: 260,
                ty: 306,
                boxX: 70,
                boxW: 360,
                title: uiText(lang, "MICRO_FINANCE"),
                sub: uiText(lang, "MUDRA_SHISHU"),
                det: uiText(lang, "MICRO_DETAIL"),
              },
              {
                id: "term",
                d: "M 532 186 C 625 222, 685 242, 740 300",
                lx: 740,
                ty: 306,
                boxX: 570,
                boxW: 360,
                title: uiText(lang, "TERM_LOAN"),
                sub: uiText(lang, "MUDRA_TARUN"),
                det: uiText(lang, "TERM_DETAIL"),
              },
            ] as const
          ).map((b) => {
            const active = route === b.id;
            return (
              <g key={b.id}>
                <motion.path
                  d={b.d}
                  fill="none"
                  stroke={active ? "#E3B75B" : "rgba(237,234,223,.16)"}
                  strokeWidth={active ? 2 : 1.4}
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: 0.5, ease: [0.65, 0, 0.35, 1] }}
                />
                {active && (
                  <path
                    d={b.d}
                    fill="none"
                    stroke="#FFF3D6"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeDasharray="2 16"
                  >
                    <animate attributeName="stroke-dashoffset" from="36" to="0" dur="0.9s" repeatCount="indefinite" />
                  </path>
                )}
                <motion.circle
                  cx={b.lx}
                  cy={b.ty - 4}
                  r={5}
                  animate={{ fill: active ? "#E3B75B" : "#20261F", opacity: active ? 1 : 0.4 }}
                />
                <motion.rect
                  x={b.boxX}
                  y={b.ty + 12}
                  width={b.boxW}
                  height={112}
                  rx={14}
                  animate={{
                    fill: active ? "rgba(200,145,45,.09)" : "rgba(255,255,255,.02)",
                    stroke: active ? "rgba(227,183,91,.65)" : "rgba(237,234,223,.14)",
                  }}
                  strokeWidth={1.2}
                />
                {/* title */}
                <motion.text
                  x={b.boxX + b.boxW / 2}
                  y={b.ty + 42}
                  textAnchor="middle"
                  fontSize={12}
                  className="body-ui"
                  animate={{ fill: active ? "#F3EFE2" : "rgba(237,234,223,.5)" }}
                  letterSpacing="2"
                >
                  {b.title}
                </motion.text>
                {/* scheme name */}
                <motion.text
                  x={b.boxX + b.boxW / 2}
                  y={b.ty + 62}
                  textAnchor="middle"
                  fontSize={10}
                  className="body-ui"
                  animate={{ fill: active ? "#E3B75B" : "rgba(237,234,223,.35)" }}
                  style={{ textTransform: "none", letterSpacing: ".04em" }}
                >
                  {b.sub}
                </motion.text>
                {/* detail — wrapped inside box via foreignObject */}
                <foreignObject x={b.boxX + 12} y={b.ty + 74} width={b.boxW - 24} height={36}>
                  {/* @ts-ignore — foreignObject HTML content */}
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      fontFamily: "var(--font-body)",
                      fontSize: "8.5px",
                      letterSpacing: "0.04em",
                      lineHeight: 1.35,
                      textTransform: "uppercase",
                      fontWeight: 500,
                      color: active ? "rgba(237,234,223,.72)" : "rgba(237,234,223,.32)",
                      wordBreak: "break-word",
                      whiteSpace: "normal",
                    }}
                  >
                    {b.det}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>

        <p style={{ textAlign: "center", marginTop: 14 }}>
          <span className="body-ui" style={{ fontSize: 8, letterSpacing: ".08em", color: "rgba(237,234,223,0.42)" }}>
            {uiText(lang, "SCHEME_FOOTNOTE")}
          </span>
        </p>

        <p className="body-ui" style={{ marginTop: 14, fontSize: 9.5, color: "rgba(237,234,223,.35)", textAlign: "center" }}>
          {uiText(lang, "SCHEME_GUIDELINES")}
        </p>
      </div>
    </section>
  );
}
