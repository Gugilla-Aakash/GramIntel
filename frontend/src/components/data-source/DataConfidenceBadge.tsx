"use client";

import { motion } from "framer-motion";
import { Icon } from "../icons";
import { useUiLang } from "@/lib/landing-strings";
import { uiText } from "@/lib/ui-strings";

export type Confidence = "verified" | "estimate" | "demo";

const CONF: Record<
  Confidence,
  { label: string; color: string; border: string; bg: string; icon: any }
> = {
  verified: {
    label: "VERIFIED DATA",
    color: "#0B5D3B",
    border: "rgba(11,93,59,.4)",
    bg: "rgba(11,93,59,.07)",
    icon: Icon.Verified,
  },
  estimate: {
    label: "AI ESTIMATE",
    color: "#9A6E1F",
    border: "rgba(200,145,45,.45)",
    bg: "rgba(200,145,45,.08)",
    icon: Icon.Model,
  },
  demo: {
    label: "DEMO DATA",
    color: "#6B6A5E",
    border: "rgba(107,106,94,.4)",
    bg: "rgba(107,106,94,.08)",
    icon: Icon.DemoDb,
  },
};

const CONF_KEYS = { verified: "VERIFIED_DATA", estimate: "AI_ESTIMATE", demo: "DEMO_DATA" } as const;

/**
 * Quiet provenance chip. Sits under numbers/visualizations.
 * dark = on dark backgrounds.
 */
export function DataConfidenceBadge({
  status,
  dark = false,
  className,
}: {
  status: Confidence;
  dark?: boolean;
  className?: string;
}) {
  const lang = useUiLang();
  const c = CONF[status];
  const Ico = c.icon;
  return (
    <motion.span
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.3 }}
      data-conf={status}
      className={`conf-badge ${className ?? ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 8.5,
        letterSpacing: ".22em",
        fontWeight: 600,
        padding: "4px 9px",
        borderRadius: 999,
        color: dark ? undefined : c.color,
        border: `1px solid ${dark ? adjust(c.border) : c.border}`,
        background: dark ? "rgba(255,255,255,.04)" : c.bg,
        whiteSpace: "nowrap",
        lineHeight: 1,
        ["--c" as any]: c.color,
      }}
      title={`${uiText(lang, CONF_KEYS[status])} — GramIntel data provenance`}
    >
      <Ico style={{ color: dark ? "var(--gold-bright)" : c.color }} />
      <span style={{ color: dark ? "var(--muted-on-dark)" : undefined }}>{uiText(lang, CONF_KEYS[status])}</span>
    </motion.span>
  );
}

function adjust(border: string) {
  // slightly dim borders on dark surfaces
  return border.replace(/(\.\d+)\)$/, ".28)");
}
