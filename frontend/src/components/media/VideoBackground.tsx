"use client";

import { useEffect, useRef, useState } from "react";
import { useIsMobile, useMediaQuery } from "@/lib/hooks";

interface VideoBackgroundProps {
  /** ordered candidates — first that loads wins */
  sources: string[];
  posterFallback?: React.ReactNode;
  /** 0..1 */
  opacity?: number;
  /** css filter treatment for the documentary look */
  filter?: string;
  overlay?: string;
  className?: string;
}

/**
 * Cinematic muted video layer. Autoplays inline + loops.
 * Falls back through `sources` on error and finally to `posterFallback`
 * (a designed static composition), so the section is never broken.
 * Mobile & reduced-motion users get the fallback directly — no download.
 */
export function VideoBackground({
  sources,
  posterFallback,
  opacity = 1,
  filter,
  overlay = "linear-gradient(180deg, rgba(7,26,20,.25), rgba(7,26,20,.45))",
  className,
}: VideoBackgroundProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const isMobile = useIsMobile();
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");

  const skipVideo = isMobile || reduced || !sources.length;

  useEffect(() => {
    if (skipVideo) return;
    const v = ref.current;
    if (!v) return;
    v.play().catch(() => {
      /* autoplay block → poster stays; non-fatal */
    });
  }, [idx, skipVideo]);

  if (skipVideo || failed) {
    return (
      <div
        aria-hidden
        className={className}
        style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}
      >
        {posterFallback ?? <DefaultPoster />}
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        opacity: ready ? opacity : 0,
        transition: "opacity 1.4s ease",
      }}
    >
      <video
        ref={ref}
        muted
        autoPlay
        loop
        playsInline
        preload="metadata"
        poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='9'%3E%3Crect width='16' height='9' fill='%23071A14'/%3E%3C/svg%3E"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: filter ?? "saturate(.88) brightness(.96)",
        }}
        onCanPlay={() => setReady(true)}
        onError={() => {
          if (idx + 1 < sources.length) setIdx(idx + 1);
          else setFailed(true);
        }}
      >
        <source src={sources[idx]} type="video/mp4" />
      </video>
      {/* cinematic wash */}
      <div style={{ position: "absolute", inset: 0, background: overlay }} />
    </div>
  );
}

/** Designed static stand-in: deep-green gradient + slow topo drift. */
export function DefaultPoster() {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 90% at 30% 20%, #123B2C 0%, #071A14 55%, #04100C 100%)",
        }}
      />
      <svg
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.35 }}
      >
        {[90, 170, 250, 330, 410, 490, 570].map((y, i) => (
          <path
            key={y}
            d={`M -40 ${y} C 240 ${y - 60}, 480 ${y + 50}, 720 ${y - 10} S 1080 ${y + 40}, 1260 ${y}`}
            fill="none"
            stroke="rgba(169,195,174,.14)"
            strokeWidth="1"
            style={{
              transformOrigin: "center",
              animation: `topo-drift ${26 + i * 6}s ease-in-out ${i * -3}s infinite alternate`,
            }}
          />
        ))}
      </svg>
    </>
  );
}
