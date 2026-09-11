"use client";

import { useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  AnimatePresence,
} from "framer-motion";
import { SectionLabel } from "../primitives/SectionLabel";
import { useUiLang } from "@/lib/landing-strings";
import { uiText } from "@/lib/ui-strings";

export function Multilingual() {
  const lang = useUiLang();
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const word = lang === "hi" ? "हिन्दी" : lang === "te" ? "తెలుగు" : "English";
  const visualWords = [word, "GramIntel", "₹"];

  const { scrollYProgress: p } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(p, "change", (v) => {
    setIdx(Math.min(2, Math.max(0, Math.floor(v * 3))));
  });

  return (
    <section id="multilingual" style={{ background: "var(--warm)" }}>
      <div className="shell" style={{ paddingTop: "clamp(80px,12vh,150px)" }}>
        <SectionLabel index="11" title="SPEAKING YOUR LANGUAGE" />
        <h2 className="display-l" style={{ maxWidth: 800, color: "var(--text-dark)" }}>
          {uiText(lang, "SPEAK_LANGUAGE_HEAD")}
        </h2>
      </div>

      {/* ── cycling stage ── */}
      <div ref={ref} style={{ height: "260vh", position: "relative" }}>
        <div
          style={{
            position: "sticky",
            top: 0,
            height: "100svh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* constellation of languages (desktop) */}
          <div
            aria-hidden
            className="lang-field"
            style={{ position: "absolute", inset: 0 }}
          >
            {[{ word, x: 20, y: 20 }, { word: "GramIntel", x: 70, y: 12 }, { word: "₹", x: 14, y: 70 }].map((l, i) => (
              <motion.span
                key={l.word}
                animate={{
                  opacity: i === idx ? 1 : 0.16,
                  scale: i === idx ? 1 : 0.94,
                }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: "absolute",
                  left: `${l.x}%`,
                  top: `${l.y}%`,
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(28px, 3.6vw, 58px)",
                  color: i === idx ? "var(--forest)" : "#14231C",
                  fontWeight: 480,
                  whiteSpace: "nowrap",
                }}
              >
                  {l.word}
              </motion.span>
            ))}
          </div>

          {/* central insight */}
          <div style={{ textAlign: "center", padding: "0 5vw" }}>
            <AnimatePresence mode="wait">
              <motion.div
                  key={`${lang}-${idx}`}
                initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              >
                <div
                  className="serif-i"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(30px, 4.6vw, 64px)",
                    color: "#14231C",
                  }}
                >
                {uiText(lang, "YOUR_DECISION")}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* progress hairline */}
            <div style={{ width: 180, margin: "42px auto 14px", position: "relative", height: 2, background: "var(--line-on-light)" }}>
              <motion.div
                animate={{ scaleX: (idx + 1) / visualWords.length }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "var(--gold)",
                  originX: 0,
                }}
              />
            </div>
            <div className="body-ui mono-num" style={{ fontSize: 9.5, color: "rgba(20,35,28,.45)" }}>
              {String(idx + 1).padStart(2, "0")} / {String(visualWords.length).padStart(2, "0")} · {visualWords[idx].toUpperCase()}
            </div>
          </div>

          {/* mobile strip */}
          <div
            className="lang-strip"
            style={{
              display: "none",
              gap: 22,
              marginTop: 40,
              flexWrap: "wrap",
              justifyContent: "center",
              padding: "0 24px",
            }}
          >
            {visualWords.map((w, i) => (
              <span
                key={w}
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 26,
                  color: i === idx ? "var(--forest)" : "rgba(20,35,28,.25)",
                }}
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
