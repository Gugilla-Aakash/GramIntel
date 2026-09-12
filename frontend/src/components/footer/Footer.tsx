"use client";

import { motion } from "framer-motion";
import { useLenis, scrollToId } from "../system/SmoothScroll";
import { useUiLang } from "@/lib/landing-strings";
import { uiText } from "@/lib/ui-strings";

type FooterLink = { label: string; id?: string; href?: string; external?: boolean };

const COLS: { h: string; links: FooterLink[] }[] = [
  {
    h: "PRODUCT",
    links: [
      { label: "The Method", id: "how" },
      { label: "Market Intelligence", id: "market-closeup" },
      { label: "Scheme Router", id: "scheme-router" },
      { label: "Repayment Planner", id: "repayment" },
    ],
  },
  {
    h: "CONTEXT",
    links: [
      { label: "The Problem", id: "problem" },
      { label: "Data Sources", id: "viability" },
      { label: "Impact Model", id: "analyze" },
      { label: "For Lenders", href: "/portal" },
    ],
  },
  {
    h: "CONNECT",
    links: [
      { label: "Smart India Hackathon", href: "https://www.sih.gov.in", external: true },
      { label: "Team GramIntel", href: "mailto:gugillaaakash6@gmail.com" },
      { label: "Contact", href: "mailto:gugillaaakash6@gmail.com" },
      { label: "Customer care", href: "mailto:gugillaaakash6@gmail.com" },
      { label: "Legal", href: "/legal" },
    ],
  },
];

export function Footer() {
  const lang = useUiLang();
  const lenis = useLenis();
  const handleScroll = (id: string) => {
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.location.href = `/#${id}`;
      return;
    }
    scrollToId(lenis, id);
  };
  return (
    <footer style={{ background: "#04100C", position: "relative", overflow: "hidden" }}>
      {/* drifting topographic pattern */}
      <svg
        aria-hidden
        viewBox="0 0 1200 500"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5 }}
      >
        {[70, 130, 190, 250, 310].map((y, i) => (
          <motion.path
            key={y}
            d={`M -50 ${y + 60} C 200 ${y}, 400 ${y + 90}, 620 ${y + 20} S 1000 ${y - 30}, 1250 ${y + 40}`}
            fill="none"
            stroke="rgba(169,195,174,.09)"
            strokeWidth={1}
            animate={{ x: [0, 60, 0] }}
            transition={{ duration: 26 + i * 5, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </svg>

      <div className="shell" style={{ position: "relative", paddingTop: "clamp(60px, 10vh, 110px)" }}>
        {/* wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 480,
            fontVariationSettings: '"opsz" 144',
            fontSize: "clamp(72px, 14.5vw, 230px)",
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            color: "transparent",
            WebkitTextStroke: "1px rgba(237,234,223,.28)",
            userSelect: "none",
            whiteSpace: "nowrap",
          }}
        >
          GramIntel<span style={{ WebkitTextStroke: "1px rgba(227,183,91,.55)" }}>.</span>
        </motion.div>

        <div className="body-ui" style={{ fontSize: 10, letterSpacing: ".34em", color: "var(--gold)", marginTop: 18 }}>
          {uiText(lang, "HYPER_LOCAL")}
        </div>

        {/* link columns */}
        <div
          className="footer-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0,240px))",
            justifyContent: "space-between",
            gap: 32,
            marginTop: "clamp(44px, 8vh, 80px)",
          }}
        >
          {COLS.map((c) => (
            <div key={c.h}>
              <div className="body-ui" style={{ fontSize: 9.5, color: "rgba(237,234,223,.4)", marginBottom: 16 }}>
                {uiText(lang, c.h === "PRODUCT" ? "PRODUCT" : c.h === "CONTEXT" ? "CONTEXT" : "CONNECT")}
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {c.links.map((l) => {
                  if (l.id) {
                    return (
                      <button
                        key={l.label}
                        onClick={() => handleScroll(l.id!)}
                        data-cursor="button"
                        className="body-ui footer-link"
                        style={{
                          fontSize: 11,
                          letterSpacing: ".08em",
                          textTransform: "none",
                          color: "rgba(237,234,223,.68)",
                          textAlign: "left",
                        }}
                      >
                        {uiText(lang, l.label === "The Method" ? "THE_METHOD" : l.label === "Market Intelligence" ? "MARKET_INTELLIGENCE" : l.label === "Scheme Router" ? "SCHEME_ROUTER" : l.label === "Repayment Planner" ? "REPAYMENT_PLANNER" : l.label === "The Problem" ? "THE_PROBLEM_LINK" : l.label === "Data Sources" ? "DATA_SOURCES" : l.label === "Impact Model" ? "IMPACT_MODEL" : l.label === "For Lenders" ? "FOR_LENDERS" : l.label === "Team GramIntel" ? "TEAM_GRAMINTEL" : l.label === "Contact" ? "CONTACT" : l.label === "Customer care" ? "CUSTOMER_CARE" : l.label === "Legal" ? "LEGAL" : l.label === "Smart India Hackathon" ? "SMART_INDIA_HACKATHON" : l.label)}
                      </button>
                    );
                  }
                  return (
                    <a
                      key={l.label}
                      href={l.href}
                      target={l.external ? "_blank" : undefined}
                      rel={l.external ? "noopener noreferrer" : undefined}
                      data-cursor="button"
                      className="body-ui footer-link"
                      style={{
                        fontSize: 11,
                        letterSpacing: ".08em",
                        textTransform: "none",
                        color: "rgba(237,234,223,.68)",
                      }}
                    >
                      {uiText(lang, l.label === "The Method" ? "THE_METHOD" : l.label === "Market Intelligence" ? "MARKET_INTELLIGENCE" : l.label === "Scheme Router" ? "SCHEME_ROUTER" : l.label === "Repayment Planner" ? "REPAYMENT_PLANNER" : l.label === "The Problem" ? "THE_PROBLEM_LINK" : l.label === "Data Sources" ? "DATA_SOURCES" : l.label === "Impact Model" ? "IMPACT_MODEL" : l.label === "For Lenders" ? "FOR_LENDERS" : l.label === "Team GramIntel" ? "TEAM_GRAMINTEL" : l.label === "Contact" ? "CONTACT" : l.label === "Customer care" ? "CUSTOMER_CARE" : l.label === "Legal" ? "LEGAL" : l.label === "Smart India Hackathon" ? "SMART_INDIA_HACKATHON" : l.label)}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* bottom bar */}
        <div
          style={{
            borderTop: "1px solid var(--line-on-dark)",
            marginTop: "clamp(40px, 7vh, 70px)",
            padding: "26px 0 34px",
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span className="body-ui" style={{ fontSize: 9.5, color: "rgba(237,234,223,.35)" }}>
            {uiText(lang, "FOOTER_COPY")}
          </span>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <a href="/portal" className="body-ui" style={{ fontSize: 9.5, color: "rgba(237,234,223,0.5)", border: "1px solid rgba(237,234,223,0.14)", padding: "6px 10px", borderRadius: 999, letterSpacing: ".08em" }}>{uiText(lang, "OFFICER_PORTAL_ARROW")}</a>
            <span className="body-ui" style={{ fontSize: 9.5, color: "rgba(237,234,223,.35)" }}>
              {uiText(lang, "BUILT_FOR_SIH")}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
