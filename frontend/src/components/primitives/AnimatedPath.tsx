"use client";

import { motion } from "framer-motion";

interface AnimatedPathProps {
  d: string;
  stroke?: string;
  strokeWidth?: number;
  delay?: number;
  duration?: number;
  dash?: string;
  /** progress 0..1 — when provided, path draws with scroll instead of in-view */
  pathLength?: any;
  opacity?: any;
  style?: React.CSSProperties;
}

/** SVG path that draws itself (pathLength trick) — in-view or scroll-driven. */
export function AnimatedPath({
  d,
  stroke = "var(--gold)",
  strokeWidth = 1.5,
  delay = 0,
  duration = 1.6,
  dash,
  pathLength,
  opacity,
  style,
}: AnimatedPathProps) {
  const scrollDriven = pathLength !== undefined;
  const common = {
    fill: "none" as const,
    stroke,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeDasharray: dash,
    style,
  };
  if (scrollDriven) {
    return (
      <motion.path {...common} d={d} style={{ ...style, pathLength, opacity }} />
    );
  }
  return (
    <motion.path
      {...common}
      d={d}
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{
        pathLength: { duration, delay, ease: [0.65, 0, 0.35, 1] },
        opacity: { duration: 0.3, delay },
      }}
    />
  );
}
