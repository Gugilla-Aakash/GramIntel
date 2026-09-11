"use client";

import { motion } from "framer-motion";
import { SectionLabel } from "../primitives/SectionLabel";
import { SplitLines } from "../primitives/SplitText";
import { useUiLang } from "@/lib/landing-strings";
import { uiText } from "@/lib/ui-strings";

const EASE = [0.16, 1, 0.3, 1] as const;

const INPUTS = [
  { t: "LOCATION", y: 96 },
  { t: "CAPITAL", y: 236 },
  { t: "BUSINESS_IDEA", y: 376 },
];
const OUTPUTS = [
  { t: "MARKET", y: 60 },
  { t: "COMPETITION", y: 140 },
  { t: "OPPORTUNITY", y: 220 },
  { t: "RISK", y: 300 },
  { t: "FINANCE", y: 380 },
];

const EX = 560;
const EY = 262;

const inputPath = (y: number) =>
  `M 268 ${y} C 380 ${y}, 400 ${EY}, ${EX - 92} ${EY}`;
const outputPath = (y: number) =>
  `M ${EX + 92} ${EY} C 700 ${EY}, 740 ${y}, 832 ${y}`;

export function AIReasoning() {
  const lang = useUiLang();
  return (
    <section
      className="section-pad"
      style={{ background: "var(--warm)", overflow: "hidden" }}
    >
      <div className="shell">
        <SectionLabel index="07" title="THE REASONING PIPELINE" />

        <div style={{ maxWidth: 760, marginBottom: "clamp(30px,6vh,64px)" }}>
          <h2 className="display-m" style={{ color: "var(--text-dark)" }}>
            <SplitLines
              lines={[
                <>{uiText(lang, "RAW_INFORMATION")}</>,
                <>
                  {uiText(lang, "DEFENSIBLE_HEAD_A")}{" "}
                  <span className="serif-i" style={{ color: "var(--forest)" }}>
                    {uiText(lang, "DEFENSIBLE_HEAD_B")}
                  </span>{" "}
                  {uiText(lang, "DEFENSIBLE_HEAD_C")}
                </>,
              ]}
              stagger={0.14}
            />
          </h2>
          <p className="body-lg" style={{ marginTop: 18, color: "var(--muted-on-light)", maxWidth: 480 }}>
            {uiText(lang, "PIPELINE_BODY")}
          </p>
        </div>

        {/* ── the flow ── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.8 }}
        >
          <svg viewBox="0 0 1120 500" role="img" aria-label={uiText(lang, "PIPELINE_VISUAL_ARIA")} style={{ width: "100%", height: "auto" }}>
            {/* stage labels */}
            <text x={90} y={30} className="body-ui" fontSize={10} fill="rgba(20,35,28,.45)" letterSpacing="3">
              {uiText(lang, "INPUT")}
            </text>
            <text x={EX} y={30} textAnchor="middle" className="body-ui" fontSize={10} fill="#C8912D" letterSpacing="3">
              {uiText(lang, "INTELLIGENCE_ENGINE")}
            </text>
            <text x={1030} y={30} textAnchor="end" className="body-ui" fontSize={10} fill="rgba(20,35,28,.45)" letterSpacing="3">
              {uiText(lang, "OUTPUT")}
            </text>

            {/* connectors */}
            {INPUTS.map((inp, i) => (
              <g key={`ip${i}`}>
                <motion.path
                  d={inputPath(inp.y)}
                  fill="none"
                  stroke="rgba(11,93,59,.35)"
                  strokeWidth={1.4}
                  strokeDasharray="1 0"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.1, delay: 0.4 + i * 0.15, ease: [0.65, 0, 0.35, 1] }}
                />
                {/* travelling data pulse */}
                <circle r={3.4} fill="#C8912D">
                  <animateMotion dur={`${2.6 + i * 0.4}s`} begin="1.6s" repeatCount="indefinite" path={inputPath(inp.y)} />
                </circle>
              </g>
            ))}
            {OUTPUTS.map((out, i) => (
              <g key={`op${i}`}>
                <motion.path
                  d={outputPath(out.y)}
                  fill="none"
                  stroke="rgba(200,145,45,.45)"
                  strokeWidth={1.4}
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.1, delay: 1.3 + i * 0.12, ease: [0.65, 0, 0.35, 1] }}
                />
                <circle r={3.4} fill="#0B5D3B">
                  <animateMotion dur={`${2.8 + i * 0.3}s`} begin="2.6s" repeatCount="indefinite" path={outputPath(out.y)} />
                </circle>
              </g>
            ))}

            {/* engine core */}
            <motion.g
              initial={{ scale: 0.6, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 160, damping: 18, delay: 0.25 }}
              style={{ originX: `${(EX / 1120) * 100}%`, originY: `${(EY / 500) * 100}%` } as any}
            >
              <motion.g
                animate={{ rotate: 360 }}
                transition={{ duration: 46, repeat: Infinity, ease: "linear" }}
                style={{ originX: `${(EX / 1120) * 100}%`, originY: `${(EY / 500) * 100}%` } as any}
              >
                <circle cx={EX} cy={EY} r={86} fill="none" stroke="rgba(11,93,59,.3)" strokeDasharray="2 9" />
              </motion.g>
              <motion.g
                animate={{ rotate: -360 }}
                transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
                style={{ originX: `${(EX / 1120) * 100}%`, originY: `${(EY / 500) * 100}%` } as any}
              >
                <circle cx={EX} cy={EY} r={64} fill="none" stroke="rgba(200,145,45,.4)" strokeDasharray="1 6" />
              </motion.g>
              <circle cx={EX} cy={EY} r={46} fill="#071A14" />
              <path
                d={`M ${EX} ${EY - 24} L ${EX + 21} ${EY - 12} L ${EX + 21} ${EY + 12} L ${EX} ${EY + 24} L ${EX - 21} ${EY + 12} L ${EX - 21} ${EY - 12} Z`}
                fill="none"
                stroke="#E3B75B"
                strokeWidth={1.6}
              />
              <circle cx={EX} cy={EY} r={5} fill="#E3B75B">
                <animate attributeName="opacity" values="1;.25;1" dur="1.8s" repeatCount="indefinite" />
              </circle>
            </motion.g>

            {/* input chips */}
            {INPUTS.map((inp, i) => (
              <motion.g
                key={inp.t}
                initial={{ opacity: 0, x: -26 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.14, ease: EASE }}
              >
                <rect x={88} y={inp.y - 22} width={180} height={44} rx={22} fill="#FFFFFF" stroke="rgba(20,35,28,.16)" />
                <circle cx={112} cy={inp.y} r={3.4} fill="#0B5D3B" />
                <text x={128} y={inp.y + 4} fontSize={11} className="body-ui" fill="#14231C" letterSpacing="1.6">
                  {uiText(lang, inp.t)}
                </text>
              </motion.g>
            ))}

            {/* output chips */}
            {OUTPUTS.map((out, i) => (
              <motion.g
                key={out.t}
                initial={{ opacity: 0, x: 26 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 1.5 + i * 0.12, ease: EASE }}
              >
                <rect x={832} y={out.y - 19} width={196} height={38} rx={19} fill="#071A14" />
                <text x={930} y={out.y + 4} textAnchor="middle" fontSize={10.5} className="body-ui" fill="#F3EFE2" letterSpacing="1.6">
                  {uiText(lang, out.t)}
                </text>
              </motion.g>
            ))}
          </svg>
        </motion.div>

        {/* footnote strip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 2, duration: 1 }}
          style={{
            marginTop: "clamp(28px, 5vh, 52px)",
            display: "flex",
            flexWrap: "wrap",
            gap: "12px 34px",
            borderTop: "1px solid var(--line-on-light)",
            paddingTop: 22,
          }}
        >
          {["DATA_SATELLITE", "DATA_PRICE", "DATA_SCHEME", "DATA_RISK"].map((f) => (
            <span key={f} className="body-ui" style={{ fontSize: 9.5, color: "rgba(20,35,28,.45)" }}>
              · {uiText(lang, f)}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
