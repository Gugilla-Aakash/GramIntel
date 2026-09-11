"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useUiLang } from "@/lib/landing-strings";
import { uiText } from "@/lib/ui-strings";

interface SectionLabelProps {
  index: string; // e.g. "01"
  title: string;
  dark?: boolean;
  children?: ReactNode;
}

/** Editorial section marker: rule + index + tracked-out title. */
export function SectionLabel({ index, title, dark = false, children }: SectionLabelProps) {
  const lang = useUiLang();
  const titleKey = {
    "THE PROBLEM": "TITLE_THE_PROBLEM",
    "HOW GRAMINTEL THINKS": "TITLE_HOW_THINKS",
    "MARKET MAP": "TITLE_MARKET_MAP",
    "MARKET INTELLIGENCE · CLOSE-UP": "TITLE_MARKET_INTELLIGENCE",
    "BUSINESS VIABILITY": "TITLE_BUSINESS_VIABILITY",
    "INTELLIGENCE ENGINE": "TITLE_INTELLIGENCE_ENGINE",
    "FINANCIAL STRUCTURE": "TITLE_FINANCIAL_STRUCTURE",
    "SCHEME ROUTING": "TITLE_SCHEME_ROUTING",
    "REPAYMENT SIMULATION": "TITLE_REPAYMENT_SIMULATION",
    "MULTILINGUAL": "TITLE_MULTILINGUAL",
    "MAKE IT DEFENSIBLE": "TITLE_MAKE_IT_DEFENSIBLE",
    "SPEAKING YOUR LANGUAGE": "TITLE_SPEAKING_LANGUAGE",
    "THE REASONING PIPELINE": "TITLE_REASONING_PIPELINE",
    "THE MONEY, MADE VISIBLE": "TITLE_MONEY_VISIBLE",
  }[title];
  return (
    <div
      className="section-label"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        color: dark ? "var(--muted-on-dark)" : "var(--muted-on-light)",
        marginBottom: "clamp(36px, 6vh, 72px)",
      }}
    >
      <motion.span
        aria-hidden
        style={{
          width: 44,
          height: 1,
          originX: 0,
          background: dark ? "var(--gold)" : "var(--forest)",
        }}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
      <span className="eyebrow" style={{ whiteSpace: "nowrap" }}>
        {index} — {titleKey ? uiText(lang, titleKey) : title}
      </span>
      {children}
    </div>
  );
}
