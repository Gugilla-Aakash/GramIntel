"use client";

import { useRef, type ReactNode, type CSSProperties } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** px the element travels (upwards) across its scroll journey */
  distance?: number;
  scaleFrom?: number;
}

/** GPU-friendly vertical parallax driven by element position in viewport. */
export function Parallax({
  children,
  className,
  style,
  distance = 80,
  scaleFrom,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  const scale = scaleFrom
    ? useTransform(scrollYProgress, [0, 0.5, 1], [scaleFrom, 1, scaleFrom])
    : undefined;

  return (
    <div ref={ref} className={className} style={style}>
      <motion.div style={{ y, scale, willChange: "transform" }}>{children}</motion.div>
    </div>
  );
}
