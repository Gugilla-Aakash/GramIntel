"use client";

import { motion, type MotionValue, useTransform } from "framer-motion";
import type { ReactNode } from "react";
import { useUiLang } from "@/lib/landing-strings";
import { uiText } from "@/lib/ui-strings";

const CX = 320;
const CY = 320;

const polar = (deg: number, r: number): [number, number] => [
  CX + r * Math.cos((deg * Math.PI) / 180),
  CY + r * Math.sin((deg * Math.PI) / 180),
];

const arcPath = (r: number, a0: number, a1: number) => {
  const [x0, y0] = polar(a0, r);
  const [x1, y1] = polar(a1, r);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
};

interface NodeDef {
  label: string;
  angle: number;
  radius: number;
  delay: number;
  anchor: "start" | "middle" | "end";
}

const NODES: NodeDef[] = [
  { label: "MARKETS", angle: -62, radius: 196, delay: 1.45, anchor: "end" },
  { label: "CONSUMERS", angle: -12, radius: 168, delay: 1.65, anchor: "start" },
  { label: "DEMAND", angle: 38, radius: 205, delay: 1.85, anchor: "start" },
  { label: "SUPPLIERS", angle: 152, radius: 178, delay: 2.05, anchor: "end" },
  { label: "COMPETITORS", angle: 197, radius: 214, delay: 2.25, anchor: "middle" },
  { label: "TRANSPORT", angle: 249, radius: 162, delay: 2.45, anchor: "end" },
];

const NODE_KEYS: Record<string, string> = {
  MARKETS: "MARKETS",
  CONSUMERS: "CONSUMERS",
  DEMAND: "DEMAND",
  SUPPLIERS: "SUPPLIERS",
  COMPETITORS: "COMPETITORS",
  TRANSPORT: "TRANSPORT",
};

const connPath = (angle: number, radius: number) => {
  const [x, y] = polar(angle, radius);
  const mx = (CX + x) / 2;
  const my = (CY + y) / 2;
  // perpendicular offset for an organic curve
  const nx = -(y - CY);
  const ny = x - CX;
  const len = Math.hypot(nx, ny) || 1;
  const k = 26;
  return `M ${CX} ${CY} Q ${mx + (nx / len) * k} ${my + (ny / len) * k} ${x} ${y}`;
};

function Layer({
  x,
  y,
  children,
}: {
  x: MotionValue<number>;
  y: MotionValue<number>;
  children: ReactNode;
}) {
  return <motion.g style={{ x, y }}>{children}</motion.g>;
}

/**
 * The living local economy. Loads as a choreographed sequence:
 * grid → village marker → radius → data nodes → connections → demand pings
 * → OPPORTUNITY DETECTED. Depth layers respond to pointer parallax.
 */
export function EconomyVisual({
  mx,
  my,
}: {
  mx: MotionValue<number>;
  my: MotionValue<number>;
}) {
  const lang = useUiLang();
  const gx = useTransform(mx, (v) => v * 7);
  const gy = useTransform(my, (v) => v * 5);
  const rx = useTransform(mx, (v) => v * 14);
  const ry = useTransform(my, (v) => v * 10);
  const nx = useTransform(mx, (v) => v * 22);
  const ny = useTransform(my, (v) => v * 16);
  const ox = useTransform(mx, (v) => v * 30);
  const oy = useTransform(my, (v) => v * 22);

  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <svg
      viewBox="0 0 640 640"
      role="img"
      aria-label={uiText(lang, "ECONOMY_ARIA")}
      style={{ width: "100%", height: "auto", overflow: "visible" }}
    >
      <defs>
        <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C8912D" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#C8912D" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#C8912D" stopOpacity="0" />
        </radialGradient>
        <pattern id="mini-grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(11,93,59,.08)" strokeWidth="1" />
        </pattern>
      </defs>

      {/* ── layer 0 · survey grid ── */}
      <Layer x={gx} y={gy}>
        <motion.circle
          cx={CX}
          cy={CY}
          r={296}
          fill="url(#mini-grid)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, delay: 0.15 }}
        />
      </Layer>

      {/* ── layer 1 · dashed orbits (ambient rotation) ── */}
      <Layer x={rx} y={ry}>
        {[188, 246].map((r, i) => (
          <motion.circle
            key={r}
            cx={CX}
            cy={CY}
            r={r}
            fill="none"
            stroke="rgba(11,93,59,.22)"
            strokeWidth="1"
            strokeDasharray={i === 0 ? "2 7" : "1 11"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, rotate: i === 0 ? 360 : -360 }}
            transition={
              {
                opacity: { duration: 1.2, delay: 0.35 },
                rotate: { duration: i === 0 ? 90 : 140, repeat: Infinity, ease: "linear", delay: 0 },
              } as any
            }
            style={{ originX: `${(CX / 640) * 100}%`, originY: `${(CY / 640) * 100}%` } as any}
          />
        ))}
      </Layer>

      {/* ── layer 2 · market radius ── */}
      <Layer x={rx} y={ry}>
        <motion.circle
          cx={CX}
          cy={CY}
          r={172}
          fill="rgba(11,93,59,0.028)"
          stroke="#0B5D3B"
          strokeWidth="1.4"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.3, delay: 0.95, ease }}
          style={{ originX: `${(CX / 640) * 100}%`, originY: `${(CY / 640) * 100}%` } as any}
        />
        <motion.text
          x={CX + 122}
          y={CY - 122}
          className="body-ui"
          fontSize={10}
          fill="rgba(20,35,28,.55)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.75 }}
        >
          {uiText(lang, "MARKET_RADIUS")}
        </motion.text>

        {/* opportunity arc — activates last */}
        <motion.path
          d={arcPath(172, -84, -18)}
          fill="none"
          stroke="#C8912D"
          strokeWidth="3.4"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, delay: 3.05, ease }}
        />
      </Layer>

      {/* ── layer 3 · connections ── */}
      <Layer x={nx} y={ny}>
        {NODES.map((n) => (
          <motion.path
            key={n.label}
            d={connPath(n.angle, n.radius)}
            fill="none"
            stroke="rgba(11,93,59,.4)"
            strokeWidth="1.2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.05, delay: n.delay + 0.42, ease }}
          />
        ))}
      </Layer>

      {/* ── layer 4 · the village marker ── */}
      <Layer x={nx} y={ny}>
        <motion.circle
          cx={CX}
          cy={CY}
          r={64}
          fill="url(#core-glow)"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, delay: 0.55, ease }}
          style={{ originX: "50%", originY: "50%" } as any}
        />
        {[0, 1].map((i) => (
          <motion.circle
            key={i}
            cx={CX}
            cy={CY}
            r={10}
            fill="none"
            stroke="#C8912D"
            strokeWidth="1.2"
            animate={{ scale: [1, 3.1], opacity: [0.55, 0] }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              delay: 0.9 + i * 1.3,
              ease: "easeOut",
            }}
            style={{ originX: `${(CX / 640) * 100}%`, originY: `${(CY / 640) * 100}%` } as any}
          />
        ))}
        <motion.circle
          cx={CX}
          cy={CY}
          r={6.5}
          fill="#071A14"
          stroke="#E3B75B"
          strokeWidth="2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 15, delay: 0.55 }}
          style={{ originX: `${(CX / 640) * 100}%`, originY: `${(CY / 640) * 100}%` } as any}
        />
        <motion.text
          x={CX}
          y={CY - 22}
          textAnchor="middle"
          className="body-ui"
          fontSize={9.5}
          fill="rgba(7,26,20,.72)"
          initial={{ opacity: 0, y: CY - 14 }}
          animate={{ opacity: 1, y: CY - 22 }}
          transition={{ duration: 0.7, delay: 0.85 }}
        >
          {uiText(lang, "YOUR_VILLAGE")}
        </motion.text>
      </Layer>

      {/* ── layer 5 · economy nodes ── */}
      <Layer x={nx} y={ny}>
        {NODES.map((n) => {
          const [px, py] = polar(n.angle, n.radius);
          const lx = px + (n.anchor === "end" ? -12 : n.anchor === "start" ? 12 : 0);
          const ly = py + (n.anchor === "middle" ? -14 : 4);
          return (
            <g key={n.label}>
              <motion.circle
                cx={px}
                cy={py}
                r={13}
                fill="none"
                stroke="rgba(71,112,92,.5)"
                strokeWidth="1"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 240, damping: 17, delay: n.delay }}
                style={{ originX: `${(px / 640) * 100}%`, originY: `${(py / 640) * 100}%` } as any}
              />
              <motion.circle
                cx={px}
                cy={py}
                r={3.2}
                fill="#0B5D3B"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 16, delay: n.delay + 0.12 }}
                style={{ originX: `${(px / 640) * 100}%`, originY: `${(py / 640) * 100}%` } as any}
              />
              {n.label === "DEMAND" && (
                <>
                  {[0, 1].map((i) => (
                    <motion.circle
                      key={i}
                      cx={px}
                      cy={py}
                      r={6}
                      fill="none"
                      stroke="#C8912D"
                      strokeWidth="1"
                      animate={{ scale: [1, 2.6], opacity: [0.7, 0] }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        delay: 2.85 + i * 1.1,
                        ease: "easeOut",
                      }}
                      style={{ originX: `${(px / 640) * 100}%`, originY: `${(py / 640) * 100}%` } as any}
                    />
                  ))}
                  <motion.circle cx={px} cy={py} r={3.2} fill="#C8912D" />
                </>
              )}
              <motion.text
                x={lx}
                y={ly}
                textAnchor={n.anchor}
                className="body-ui"
                fontSize={9.5}
                fill="rgba(20,35,28,.68)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: n.delay + 0.25 }}
              >
                {uiText(lang, NODE_KEYS[n.label]).toUpperCase()}
              </motion.text>
            </g>
          );
        })}
      </Layer>

      {/* ── layer 6 · opportunity signal ── */}
      <Layer x={ox} y={oy}>
        <motion.g
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 3.3, ease }}
        >
          {(() => {
            const [ax, ay] = polar(-51, 172);
            return <circle cx={ax} cy={ay} r={4.5} fill="#C8912D" />;
          })()}
          <rect
            x={370}
            y={96}
            width={236}
            height={38}
            rx={19}
            fill="#071A14"
            stroke="rgba(227,183,91,.65)"
            strokeWidth="1"
          />
          <circle cx={392} cy={115} r={3} fill="#E3B75B" />
          <text
            x={408}
            y={119}
            className="body-ui"
            fontSize={9.5}
            fill="#F3EFE2"
            letterSpacing="1.0"
          >
            {uiText(lang, "OPPORTUNITY_DETECTED")}
          </text>
        </motion.g>
      </Layer>
    </svg>
  );
}
