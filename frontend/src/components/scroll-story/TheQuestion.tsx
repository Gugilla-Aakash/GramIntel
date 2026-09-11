"use client";

import { useUiLang } from "@/lib/landing-strings";
import { uiText } from "@/lib/ui-strings";

/**
 * TheQuestion — now a 40vh pull-quote veil.
 * Kept as standalone fallback; primary mantra lives inside Hero's veil.
 * Height reduced from 240vh pinned dark to minimal 40vh to save a dark beat.
 */
export function TheQuestion() {
  const lang = useUiLang();
  return (
    <section
      aria-label="Mantra"
      style={{
        height: "40vh",
        minHeight: 280,
        position: "relative",
        background: "#071A14",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div className="shell" style={{ textAlign: "center", position: "relative" }}>
        <div
          aria-hidden
          style={{
            height: 1,
            width: "min(160px, 36vw)",
            margin: "0 auto 22px",
            background: "linear-gradient(90deg, transparent, var(--gold), transparent)",
          }}
        />
        <p
          className="display-m serif-i"
          style={{
            color: "var(--text-light)",
            fontSize: "clamp(22px, 3.2vw, 40px)",
            lineHeight: 1.2,
            maxWidth: 720,
            margin: "0 auto",
            textWrap: "balance",
          }}
        >
          {uiText(lang, "VEIL_QUOTE")}
        </p>
      </div>
    </section>
  );
}

/** Reusable veil quote for embedding inside Hero's veil. */
export function VeilQuote() {
  const lang = useUiLang();
  return (
    <div style={{ textAlign: "center", padding: "0 5vw" }}>
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
          fontSize: "clamp(20px, 3vw, 36px)",
          lineHeight: 1.25,
          maxWidth: 640,
          margin: "0 auto",
          textWrap: "balance",
        }}
      >
        {uiText(lang, "VEIL_QUOTE")}
      </p>
    </div>
  );
}
