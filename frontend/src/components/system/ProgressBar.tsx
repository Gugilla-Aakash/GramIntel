"use client";

import { motion, useScroll, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useEffect } from "react";

/**
 * Ultra-thin scroll progress. The fill shifts hue across the journey:
 * DISCOVERY → INTELLIGENCE → DECISION, with a quiet phase caption.
 */
export function ProgressBar() {
  const { scrollYProgress } = useScroll();
  const x = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });
  const bg = useTransform(
    scrollYProgress,
    [0, 0.38, 0.66, 1],
    ["#7FA98F", "#C8912D", "#E3B75B", "#F3EFE2"]
  );

  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      setPhase(v < 0.34 ? 0 : v < 0.72 ? 1 : 2);
    });
    return () => unsub();
  }, [scrollYProgress]);

  const phases = ["DISCOVERY", "INTELLIGENCE", "DECISION"];

  return (
    <>
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          zIndex: 150,
          background: "rgba(128,128,120,.14)",
        }}
      >
        <motion.div
          style={{
            height: "100%",
            width: "100%",
            originX: 0,
            scaleX: x,
            background: bg,
          }}
        />
        {/* thirds ticks */}
        {[0.34, 0.72].map((p) => (
          <span
            key={p}
            style={{
              position: "absolute",
              top: 0,
              left: `${p * 100}%`,
              width: 1,
              height: 6,
              background: "rgba(128,128,120,.35)",
            }}
          />
        ))}
      </div>

      {/* phase caption */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: "50%",
          transform: "translateX(-50%)",
          bottom: 20,
          zIndex: 150,
          pointerEvents: "none",
          mixBlendMode: "exclusion",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <motion.span
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 2.4, repeat: Infinity }}
          style={{ width: 5, height: 5, borderRadius: 99, background: "#fff", display: "block" }}
        />
        <AnimatePresence mode="wait">
          <motion.span
            key={phase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 0.75, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="body-ui"
            style={{ fontSize: 9.5, color: "#fff" }}
          >
            {phases[phase]}
          </motion.span>
        </AnimatePresence>
      </div>
    </>
  );
}
