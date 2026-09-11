"use client";

import { useRef, type ReactNode, type CSSProperties } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  strength?: number;
  onClick?: () => void;
  cursor?: string;
  cursorLabel?: string;
  as?: "button" | "div";
}

/**
 * Magnetic hover wrapper — content drifts toward the pointer and springs back.
 * Pure transform-based, no layout thrash.
 */
export function MagneticButton({
  children,
  className,
  style,
  strength = 0.32,
  onClick,
  cursor = "button",
  cursorLabel,
  as = "button",
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 14, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 180, damping: 14, mass: 0.4 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const Tag = (as === "button" ? motion.button : motion.div) as any;

  return (
    <Tag
      ref={ref}
      className={className}
      style={{ ...style, x: sx, y: sy }}
      onMouseMove={onMove}
      onMouseLeave={reset}
      onClick={onClick}
      data-cursor={cursor}
      data-cursor-label={cursorLabel}
      whileTap={{ scale: 0.97 }}
    >
      {children}
    </Tag>
  );
}
