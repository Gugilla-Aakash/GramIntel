"use client";

import { motion } from "framer-motion";
import { Icon } from "../icons";
import type { Confidence } from "./DataConfidenceBadge";
import { useUiLang } from "@/lib/landing-strings";
import { uiText } from "@/lib/ui-strings";

const META: Record<Confidence, { kicker: string; body: (lang: Parameters<typeof uiText>[0], note?: string) => string }> = {
  verified: {
    kicker: "DATA_SOURCE",
    body: (lang, n) => n ?? uiText(lang, "PUBLIC_DATASET"),
  },
  estimate: {
    kicker: "MODEL",
    body: (lang, n) => n ?? uiText(lang, "AI_ESTIMATE_MEDIUM"),
  },
  demo: {
    kicker: "PROTOTYPE",
    body: (lang, n) => n ?? uiText(lang, "SIMULATED_DATA"),
  },
};

/**
 * Expandable provenance footnote for charts and big numbers.
 * Renders a quiet ⓘ line; hover/tap reveals the full source note.
 */
export function DataSourceLabel({
  status,
  note,
  updated,
  dark = false,
}: {
  status: Confidence;
  note?: string;
  updated?: string;
  dark?: boolean;
}) {
  const lang = useUiLang();
  const m = META[status];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, delay: 0.4 }}
      tabIndex={0}
      className="ds-label"
      style={{ color: dark ? "var(--muted-on-dark)" : "var(--muted-on-light)" }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
        <Icon.Info />
        <span className="body-ui" style={{ fontSize: 8.5, letterSpacing: ".2em", fontWeight: 600 }}>
          {uiText(lang, m.kicker)}
        </span>
        <span style={{ fontSize: 11, opacity: 0.85 }}>{m.body(lang, note)}</span>
        {updated && (
          <span style={{ fontSize: 10, opacity: 0.55 }}>· Updated: {updated}</span>
        )}
      </span>
    </motion.div>
  );
}
