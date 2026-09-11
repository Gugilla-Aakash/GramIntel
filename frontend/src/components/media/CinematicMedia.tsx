"use client";

import { useRef, useState, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useMediaQuery } from "@/lib/hooks";

interface CinematicMediaProps {
  src: string;
  alt: string;
  /** designed fallback if the remote image fails */
  fallback?: ReactNode;
  children?: ReactNode;
  height?: string;
  parallax?: number;
}

/**
 * Editorial image with cinematic treatment:
 * slow-zoom clip reveal, subtle parallax, grain border.
 * Floating data panels can be passed as children (absolutely positioned).
 */
export function CinematicMedia({
  src,
  alt,
  fallback,
  children,
  height = "clamp(380px, 72vh, 720px)",
  parallax = 40,
}: CinematicMediaProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [parallax, -parallax]);
  const imgY = reduced ? 0 : undefined;

  return (
    <div ref={wrapRef} style={{ position: "relative", height }}>
      {/* masked frame with hairline */}
      <motion.div
        className="cm-frame"
        initial={{ clipPath: "inset(6% 4% 10% 4% round 18px)" }}
        whileInView={{ clipPath: "inset(0% 0% 0% 0% round 14px)" }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          border: "1px solid rgba(20,35,28,.16)",
          background: "#E9E5D8",
        }}
      >
        {failed ? (
          <div style={{ position: "absolute", inset: 0 }}>{fallback ?? <PhotoFallback />}</div>
        ) : (
          <motion.div style={{ y, position: "absolute", inset: -parallax, willChange: "transform" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              loading="lazy"
              decoding="async"
              sizes="(max-width: 900px) 100vw, 50vw"
              onError={() => setFailed(true)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "saturate(.88) contrast(1.02) brightness(.97)",
                transform: imgY === 0 ? "none" : undefined,
              }}
            />
          </motion.div>
        )}
        {/* documentary grade wash + vignette */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(7,26,20,.06), transparent 30%, transparent 62%, rgba(7,26,20,.42))",
          }}
        />
      </motion.div>

      {/* caption chip */}
      <div
        className="body-ui"
        style={{
          position: "absolute",
          left: 16,
          bottom: 14,
          fontSize: 8.5,
          letterSpacing: ".24em",
          color: "rgba(243,239,226,.85)",
          background: "rgba(7,26,20,.55)",
          padding: "6px 11px",
          borderRadius: 999,
          backdropFilter: "blur(4px)",
        }}
      >
        FIELD DOCUMENTATION · INDIA
      </div>

      {children}
    </div>
  );
}

function PhotoFallback() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background:
          "linear-gradient(160deg, #2A5743 0%, #123B2C 48%, #071A14 100%)",
        display: "flex",
        alignItems: "flex-end",
        padding: 28,
      }}
    >
      <span className="body-ui" style={{ fontSize: 9, color: "rgba(237,234,223,.6)", letterSpacing: ".3em" }}>
        GRAMINTEL FIELD ARCHIVE
      </span>
    </div>
  );
}
