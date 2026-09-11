"use client";

import { motion, type Variants } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

interface SplitLinesProps {
  lines: ReactNode[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  stagger?: number;
  once?: boolean;
  style?: CSSProperties;
  /** when provided, drives reveal from scroll progress instead of in-view */
}

/** Masked line-by-line reveal — each line rises out of an overflow-hidden clip. */
export function SplitLines({
  lines,
  className,
  lineClassName,
  delay = 0,
  stagger = 0.12,
  once = true,
  style,
}: SplitLinesProps) {
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };
  const lineV: Variants = {
    hidden: { y: "112%", rotate: 2.5 },
    show: { y: "0%", rotate: 0, transition: { duration: 1.15, ease: EASE } },
  };
  return (
    <motion.span
      className={className}
      style={{ display: "block", ...style }}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.6 }}
      aria-label={typeof lines === "object" ? undefined : String(lines)}
    >
      {lines.map((l, i) => (
        <span
          key={i}
          style={{ display: "block", overflow: "hidden", paddingBottom: "0.08em", marginBottom: "-0.08em" }}
        >
          <motion.span
            variants={lineV}
            className={lineClassName}
            style={{ display: "block", transformOrigin: "left top" }}
          >
            {l}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

interface SplitWordsProps {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
  once?: boolean;
}

/** Word-by-word rise for headlines that wrap naturally. */
export function SplitWords({
  text,
  className,
  wordClassName,
  delay = 0,
  stagger = 0.055,
  once = true,
}: SplitWordsProps) {
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };
  const wordV: Variants = {
    hidden: { y: "115%" },
    show: { y: "0%", transition: { duration: 0.9, ease: EASE } },
  };
  return (
    <motion.span
      className={className}
      style={{ display: "inline-block" }}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.6 }}
    >
      {text.split(" ").map((w, i) => (
        <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom" }}>
          <motion.span className={wordClassName} variants={wordV} style={{ display: "inline-block" }}>
            {w}
            {"\u00A0"}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
