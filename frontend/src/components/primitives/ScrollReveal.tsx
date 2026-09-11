"use client";

import { motion, type Variants } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  duration?: number;
  y?: number;
  once?: boolean;
  amount?: number;
}

/** Subtle rise + settle reveal on scroll into view. */
export function ScrollReveal({
  children,
  className,
  style,
  delay = 0,
  duration = 1.0,
  y = 36,
  once = true,
  amount = 0.35,
}: ScrollRevealProps) {
  const v: Variants = {
    hidden: { opacity: 0, y, filter: "blur(4px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration, ease: EASE, delay },
    },
  };
  return (
    <motion.div
      className={className}
      style={style}
      variants={v}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
    >
      {children}
    </motion.div>
  );
}

/** Hairline that draws itself horizontally when in view. */
export function RevealRule({
  dark = false,
  className,
  delay = 0,
}: {
  dark?: boolean;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      aria-hidden
      className={className}
      style={{
        height: 1,
        background: dark ? "var(--line-on-dark)" : "var(--line-on-light)",
        originX: 0,
      }}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{ duration: 1.4, ease: EASE, delay }}
    />
  );
}
