"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { HeroMapBackground } from "./HeroMapBackground";
import { EconomyVisual } from "./EconomyVisual";
import { MagneticButton } from "../primitives/MagneticButton";
import { SplitLines } from "../primitives/SplitText";
import { VideoBackground } from "../media/VideoBackground";
import { Icon } from "../icons";
import { MEDIA } from "@/lib/media";
import { tL, useUiLang } from "@/lib/landing-strings";
import { useLenis, scrollToId } from "../system/SmoothScroll";
import { useIsMobile } from "../../lib/hooks";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  const isMobile = useIsMobile();
  const lang = useUiLang();

  // pointer parallax (springs for organic lag)
  const pmx = useMotionValue(0);
  const pmy = useMotionValue(0);
  const mx = useSpring(pmx, { stiffness: 50, damping: 18 });
  const my = useSpring(pmy, { stiffness: 50, damping: 18 });

  const { scrollYProgress: p } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  /* ── cinematic exit: zoom INTO the local economy ── */
  const headY = useTransform(p, [0.08, 0.62], [0, -190]);
  const headOpacity = useTransform(p, [0.16, 0.58], [1, 0]);
  const headX = useTransform(mx, (v) => v * -12);
  const headYm = useTransform(my, (v) => v * -8);

  const visScale = useTransform(p, [0, 0.85], [1, 1.5]);
  const visX = useTransform(p, [0.05, 0.85], ["0%", isMobile ? "-38%" : "-46%"]);
  const visY = useTransform(p, [0.05, 0.85], ["0%", "-4%"]);
  const visOpacity = useTransform(p, [0.55, 0.92], [1, 0]);

  const bgScale = useTransform(p, [0, 1], [1, 1.28]);
  const veil = useTransform(p, [0.3, 0.96], [0, 0.94]);
  const veilQuoteOpacity = useTransform(p, [0.42, 0.68], [0, 1]);
  const veilQuoteY = useTransform(p, [0.42, 0.68], [18, 0]);

  const cueOpacity = useTransform(p, [0, 0.08], [1, 0]);
  const metaOpacity = useTransform(p, [0.05, 0.2], [1, 0]);

  return (
    <section id="top" ref={containerRef} style={{ height: "178vh", position: "relative" }}>
      <motion.div
        style={{
          position: "sticky",
          top: 0,
          height: "100svh",
          overflow: "hidden",
          background:
            "linear-gradient(178deg, #FCFBF7 0%, #F7F5EF 62%, #EFEDE3 100%)",
        }}
        onPointerMove={(e) => {
          if (isMobile) return;
          pmx.set(e.clientX / window.innerWidth - 0.5);
          pmy.set(e.clientY / window.innerHeight - 0.5);
        }}
      >
        {/* documentary reality layer — barely there, felt more than seen */}
        <VideoBackground
          sources={[MEDIA.heroRuralRoad.mp4, MEDIA.heroRuralRoad.fallback]}
          opacity={0.16}
          filter="saturate(.5) contrast(.92) brightness(1.02)"
          overlay="linear-gradient(180deg, rgba(252,251,247,.5), rgba(247,245,239,.35))"
        />

        {/* living geographic layer */}
        <motion.div style={{ scale: bgScale, position: "absolute", inset: 0, willChange: "transform" }}>
          <HeroMapBackground />
        </motion.div>

        {/* soft vignette to focus center */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 90% 70% at 50% 42%, transparent 55%, rgba(7,26,20,.07) 100%)",
          }}
        />

        {/* content */}
        <div
          className="shell"
          style={{
            position: "relative",
            zIndex: 2,
            height: "100%",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.35fr .85fr",
            alignItems: "center",
            gap: "clamp(24px, 4vw, 64px)",
            paddingTop: "var(--nav-h)",
          }}
        >
          {/* ── LEFT · headline ── */}
          <motion.div style={{ y: headY, opacity: headOpacity }}>
            <motion.div style={{ x: headX, y: headYm }}>
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.35, ease: EASE }}
                style={{ marginBottom: "clamp(20px, 3.4vh, 34px)" }}
              >
                <span
                  className="eyebrow"
                  style={{ color: "var(--forest)", display: "inline-flex", alignItems: "center", gap: 12 }}
                >
                  <span
                    aria-hidden
                    style={{ width: 26, height: 1, background: "var(--gold)", display: "inline-block" }}
                  />
                  {tL(lang, "HERO", "eyebrow")}
                </span>
              </motion.div>

              <h1 className="display-xl" style={{ fontSize: "clamp(42px, 5vw, 78px)" }}>
                <SplitLines
                  delay={0.55}
                  stagger={0.14}
                  lines={[
                    <>{tL(lang, "HERO", "line1")}</>,
                    <>
                      <span className="serif-i" style={{ color: "var(--forest)" }}>
                        {tL(lang, "HERO", "line2")}
                      </span>
                    </>,
                    <>
                      {tL(lang, "HERO", "line3a") ? <>{tL(lang, "HERO", "line3a")} </> : null}
                      <span className="serif-i">{tL(lang, "HERO", "line3b")}</span>
                    </>,
                    <>{tL(lang, "HERO", "line4")}<span style={{ color: "var(--gold)" }}>.</span></>,
                  ]}
                />
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.5, ease: EASE }}
                className="body-lg"
                style={{
                  maxWidth: 480,
                  marginTop: "clamp(22px, 3.6vh, 38px)",
                  color: "var(--muted-on-light)",
                }}
              >
                {tL(lang, "HERO", "sub")}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.72, ease: EASE }}
                style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: "clamp(26px, 4.4vh, 44px)" }}
              >
                <MagneticButton
                  onClick={() => { window.location.href = "/assistant"; }}
                  cursor="button"
                  style={{
                    background: "var(--ink)",
                    color: "#F3EFE2",
                    borderRadius: 999,
                    padding: "17px 30px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span className="body-ui" style={{ fontSize: 12 }}>
                    {tL(lang, "HERO", "ctaPrimary")}
                  </span>
                  <Icon.ArrowRight size={15} style={{ color: "var(--gold-bright)" }} />
                </MagneticButton>
                <MagneticButton
                  onClick={() => scrollToId(lenis, "how")}
                  cursor="button"
                  strength={0.2}
                  style={{
                    border: "1px solid var(--line-on-light)",
                    borderRadius: 999,
                    padding: "17px 28px",
                  }}
                >
                  <span className="body-ui" style={{ fontSize: 12, color: "var(--charcoal)" }}>
                    {tL(lang, "HERO", "ctaSecondary")}
                  </span>
                </MagneticButton>
              </motion.div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.9 }}
                onClick={() => { window.location.href = "/map"; }}
                className="body-ui"
                style={{
                  marginTop: 18,
                  fontSize: 12,
                  color: "var(--forest)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px 0",
                }}
              >
                {tL(lang, "HERO", "mapLink")}
                <Icon.ArrowRight size={14} style={{ color: "var(--gold)" }} />
              </motion.button>
            </motion.div>
          </motion.div>

          {/* ── RIGHT · living economy ── */}
          {!isMobile && (
            <motion.div
              style={{ scale: visScale, x: visX, y: visY, opacity: visOpacity, willChange: "transform" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <EconomyVisual mx={mx} my={my} />
            </motion.div>
          )}
        </div>

        {/* mobile economy visual */}
        {isMobile && (
          <motion.div
            style={{
              position: "absolute",
              zIndex: 1,
              left: "50%",
              bottom: "6vh",
              width: "min(64vw, 340px)",
              x: "-50%",
              scale: visScale,
              opacity: visOpacity,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.9 }}
          >
            <EconomyVisual mx={mx} my={my} />
          </motion.div>
        )}

        {/* scroll cue */}
        <motion.div
          style={{
            position: "absolute",
            zIndex: 3,
            left: "clamp(20px, 4vw, 64px)",
            bottom: 26,
            display: "flex",
            alignItems: "center",
            gap: 14,
            opacity: cueOpacity,
            mixBlendMode: "multiply",
          }}
        >
          <motion.span
            animate={{ scaleY: [0.2, 1, 0.2], originY: 0 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: 1, height: 34, background: "var(--forest)", display: "block" }}
          />
          <span className="body-ui" style={{ fontSize: 10, color: "rgba(20,35,28,.6)" }}>
            Scroll — location to decision
          </span>
        </motion.div>

        {/* coordinates readout */}
        <motion.div
          className="mono-num"
          style={{
            position: "absolute",
            zIndex: 3,
            right: "clamp(20px, 4vw, 64px)",
            bottom: 30,
            fontSize: 10,
            letterSpacing: ".14em",
            color: "rgba(20,35,28,.5)",
            opacity: metaOpacity,
            textAlign: "right",
          }}
        >
          17.3835° N · 78.3222° E
          <br />
          DEMO SCENARIO · SURVEY GRID ACTIVE
        </motion.div>

        {/* the veil — melts hero into the dark section that follows; now hosts the 40vh pull-quote mantra */}
        <motion.div
          aria-hidden={false}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 5,
            background: "#071A14",
            opacity: veil,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 5vw",
          }}
        >
          <motion.div
            style={{
              textAlign: "center",
              opacity: veilQuoteOpacity,
              y: veilQuoteY,
            }}
          >
            <div
              aria-hidden
              style={{
                height: 1,
                width: "min(160px, 36vw)",
                margin: "0 auto 18px",
                background: "linear-gradient(90deg, transparent, var(--gold), transparent)",
              }}
            />
            <p
              className="display-m serif-i"
              style={{
                color: "var(--text-light)",
                fontSize: "clamp(22px, 3vw, 38px)",
                lineHeight: 1.25,
                maxWidth: 640,
                margin: "0 auto",
                textWrap: "balance",
              }}
            >
              Before you borrow, understand what you&apos;re building.
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
