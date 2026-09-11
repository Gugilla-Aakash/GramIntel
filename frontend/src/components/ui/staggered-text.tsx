"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

/**
 * GramIntel — Staggered Text (React Bits Pro API compatible)
 * ----------------------------------------------------------
 * Local fallback for @reactbits-starter/staggered-text-tw
 * Uses framer-motion (already in project) + design tokens.
 * No Tailwind required — works with your warm/forest/ink palette.
 *
 * API matches https://pro.reactbits.dev/docs/components/staggered-text
 */

type EasingFn = (t: number) => number;

interface StaggeredTextProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
  segmentBy?: "chars" | "words" | "lines";
  separator?: string;
  delay?: number; // ms between segments
  duration?: number; // s per segment
  easing?: EasingFn | EasingFn[];
  threshold?: number;
  rootMargin?: string;
  direction?: "top" | "bottom" | "left" | "right";
  blur?: boolean;
  staggerDirection?: "forward" | "reverse" | "center";
  respectReducedMotion?: boolean;
  exitOnScrollOut?: boolean;
  from?: Record<string, any>;
  to?: Record<string, any> | Record<string, any>[];
  onAnimationComplete?: () => void;
  onExitComplete?: () => void;
}

const DIR_OFFSET: Record<NonNullable<StaggeredTextProps["direction"]>, { x: number; y: number }> = {
  top: { x: 0, y: -22 },
  bottom: { x: 0, y: 22 },
  left: { x: -22, y: 0 },
  right: { x: 22, y: 0 },
};

export function StaggeredText({
  text,
  className = "",
  as: Tag = "p",
  segmentBy = "words",
  separator,
  delay = 80,
  duration = 0.6,
  easing = (t: number) => t,
  threshold = 0.1,
  rootMargin = "0px",
  direction = "top",
  blur = true,
  staggerDirection = "forward",
  respectReducedMotion = true,
  exitOnScrollOut = false,
  from,
  to,
  onAnimationComplete,
  onExitComplete,
}: StaggeredTextProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref as any, { amount: threshold, margin: rootMargin as any, once: !exitOnScrollOut });
  const [hasAnimated, setHasAnimated] = useState(false);
  const prefersReduced = typeof window !== "undefined" && respectReducedMotion ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

  // segment
  let segments: string[] = [];
  if (separator !== undefined) {
    const rows = text.split(separator);
    segments = rows.flatMap((row) => {
      if (segmentBy === "chars") return row.split("").map((c) => c);
      if (segmentBy === "words") return row.split(" ");
      return [row];
    });
  } else {
    if (segmentBy === "chars") segments = text.split("");
    else if (segmentBy === "words") segments = text.split(" ");
    else segments = text.split("\n");
  }

  // stagger order
  let order = segments.map((_, i) => i);
  if (staggerDirection === "reverse") order = order.reverse();
  else if (staggerDirection === "center") {
    const mid = Math.floor(order.length / 2);
    order = order
      .map((_, i) => i)
      .sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
  }
  const orderIndex = new Map(order.map((orig, pos) => [orig, pos]));

  const offset = DIR_OFFSET[direction];
  const defaultFrom = from ?? { opacity: 0, x: offset.x, y: offset.y, filter: blur ? "blur(6px)" : undefined };
  const defaultTo = to ?? { opacity: 1, x: 0, y: 0, filter: "blur(0px)" };

  useEffect(() => {
    if (isInView && !hasAnimated) {
      const t = setTimeout(() => setHasAnimated(true), segments.length * delay + duration * 1000);
      return () => clearTimeout(t);
    }
    if (!isInView && exitOnScrollOut && hasAnimated) {
      onExitComplete?.();
    }
  }, [isInView, hasAnimated, segments.length, delay, duration, exitOnScrollOut, onExitComplete]);

  useEffect(() => {
    if (hasAnimated) onAnimationComplete?.();
  }, [hasAnimated, onAnimationComplete]);

  if (prefersReduced) {
    const Comp: any = Tag;
    return <Comp ref={ref} className={className}>{text}</Comp>;
  }

  const Comp: any = Tag;

  return (
    <Comp ref={ref} className={className} aria-label={text} style={{ display: "inline-block" }}>
      <span aria-hidden style={{ display: "inline-flex", flexWrap: "wrap", gap: segmentBy === "words" ? "0.32em" : "0", justifyContent: "inherit" }}>
        {segments.map((seg, i) => {
          const isSpace = segmentBy === "words" && seg === " ";
          const idx = orderIndex.get(i) ?? i;
          const d = (idx * delay) / 1000;
          const ease = Array.isArray(easing) ? easing[idx % easing.length] : easing;

          return (
            <motion.span
              key={`${seg}-${i}`}
              initial={defaultFrom as any}
              animate={(isInView ? defaultTo : defaultFrom) as any}
              transition={{ duration, delay: d, ease: ease as any }}
              style={{ display: "inline-block", willChange: "transform, opacity, filter", whiteSpace: segmentBy === "chars" && seg === " " ? "pre" : undefined }}
            >
              {segmentBy === "chars" ? seg : seg}
              {segmentBy === "words" && i < segments.length - 1 ? "\u00A0" : ""}
            </motion.span>
          );
        })}
      </span>
    </Comp>
  );
}

export default StaggeredText;
