"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLenis, scrollToId } from "./SmoothScroll";
import { MagneticButton } from "../primitives/MagneticButton";
import { useIsMobile } from "../../lib/hooks";
import { LANG_OPTIONS, NAV, setUiLang, tL, useUiLang } from "../../lib/landing-strings";
import { uiText } from "../../lib/ui-strings";

const LINKS = [
  { id: "how", label: "Method" },
  { id: "market", label: "Map" },
  { id: "market-closeup", label: "Market" },
  { id: "viability", label: "Viability" },
  { id: "finance", label: "Finance" },
  { id: "scheme-router", label: "Schemes" },
  { id: "multilingual", label: "Language" },
];

export function Nav() {
  const lenis = useLenis();
  const isMobile = useIsMobile();
  const lang = useUiLang();
  const [active, setActive] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const languageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!languageOpen) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!languageRef.current?.contains(event.target as Node)) setLanguageOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLanguageOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [languageOpen]);

  useEffect(() => {
    const ids = LINKS.map((l) => l.id);
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-38% 0px -55% 0px" }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  /* lock body scroll when menu is open */
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const navigateTo = (id: string) => {
    setMenuOpen(false);
    scrollToId(lenis, id);
  };

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-[100] focus:bg-[var(--warm)] focus:text-[var(--text-dark)] focus:px-4 focus:py-2 focus:rounded-full focus:border focus:border-[var(--forest)]">{uiText(lang, "SKIP_TO_CONTENT")}</a>
      <motion.header
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 140,
          background: scrolled ? "rgba(7,26,20,0.92)" : "transparent",
          borderBottom: scrolled ? "1px solid var(--line-on-dark)" : "none",
          mixBlendMode: scrolled ? ("normal" as const) : ("exclusion" as const),
        }}
      >
        <div
          className="shell"
          style={{
            height: "var(--nav-h)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            data-cursor="button"
            onClick={() => scrollToId(lenis, "top")}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              color: "#fff",
            }}
            aria-label={uiText(lang, "HOME")}
          >
            <span
              className="serif-i"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 21,
                fontWeight: 560,
                letterSpacing: ".01em",
              }}
            >
              GramIntel
            </span>
            <span
              className="body-ui"
              style={{ fontSize: 8.5, opacity: 0.55, letterSpacing: ".3em" }}
            >
              ®
            </span>
          </button>

          <nav
            aria-label={uiText(lang, "PRIMARY_NAV")}
            style={{ display: "flex", alignItems: "center", gap: clampPx(18, 34) }}
          >
            <div className="nav-links" style={{ display: "flex", gap: clampPx(16, 30) }}>
              {LINKS.map((l, i) => (
                <button
                  key={l.id}
                  data-cursor="button"
                  onClick={() => scrollToId(lenis, l.id)}
                  className="body-ui"
                  style={{
                    fontSize: 11,
                    color: "#fff",
                    opacity: active === l.id ? 1 : 0.52,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "6px 2px",
                    transition: "opacity .35s",
                  }}
                >
                  <motion.span
                    animate={{ scale: active === l.id ? 1 : 0.4, opacity: active === l.id ? 1 : 0.25 }}
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 99,
                      background: "#E3B75B",
                      display: "inline-block",
                    }}
                  />
                  {tL(lang, "NAV", `links.${i}`)}
                </button>
              ))}
              <a
                href="/map"
                data-cursor="button"
                className="body-ui"
                style={{
                  fontSize: 11,
                  color: "#fff",
                  opacity: 0.85,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "6px 2px",
                  transition: "opacity .35s",
                  textDecoration: "none",
                }}
              >
                <span
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 99,
                    background: "#E3B75B",
                    display: "inline-block",
                    opacity: 0.9,
                  }}
                />
                {uiText(lang, "LANDING_MAP")}
              </a>
            </div>

            <div ref={languageRef} className="nav-language" role="group" aria-label={NAV[lang].langLabel}>
              <button
                type="button"
                data-cursor="button"
                className="body-ui nav-language-trigger"
                onClick={() => setLanguageOpen((open) => !open)}
                aria-expanded={languageOpen}
                aria-haspopup="listbox"
              >
                {LANG_OPTIONS.find((o) => o.code === lang)?.label ?? "EN"}
                <span aria-hidden>{languageOpen ? "⌃" : "⌄"}</span>
              </button>
              {languageOpen && (
                <div className="nav-language-menu" role="listbox" aria-label={NAV[lang].langLabel}>
                  {LANG_OPTIONS.map((o) => (
                    <button
                      key={o.code}
                      type="button"
                      role="option"
                      aria-selected={lang === o.code}
                      onClick={() => { setUiLang(o.code); setLanguageOpen(false); }}
                    >
                      <span>{o.label}</span>
                      <span>{o.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="nav-cta">
              <MagneticButton
                onClick={() => { window.location.href = "/assistant"; }}
                cursor="button"
                strength={0.25}
                style={{
                  border: "1px solid rgba(255,255,255,.45)",
                  borderRadius: 8,
                  padding: "9px 14px",
                  color: "#fff",
                  whiteSpace: "nowrap",
                  minWidth: "max-content",
                }}
              >
                <span className="body-ui" style={{ fontSize: 10.5 }}>
                  {tL(lang, "NAV", "cta")}
                </span>
              </MagneticButton>
            </div>

            {/* hamburger button — mobile only */}
            <button
              className="gi-hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? uiText(lang, "CLOSE") : uiText(lang, "MOBILE_NAV")}
              aria-expanded={menuOpen}
              style={{
                display: "none",
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {menuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="7" x2="21" y2="7" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="17" x2="21" y2="17" />
                  </>
                )}
              </svg>
            </button>
          </nav>
        </div>
        {/* hairline that fades in once scrolled */}
        <motion.div
          aria-hidden
          animate={{ opacity: scrolled ? 1 : 0 }}
          transition={{ duration: 0.6 }}
          style={{ height: 1, background: "rgba(255,255,255,.14)" }}
        />
      </motion.header>

      {/* mobile menu drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="gi-mobile-menu"
            role="dialog"
            aria-label={uiText(lang, "MOBILE_NAV")}
          >
            <div style={{ display: "grid", gap: 4 }}>
              {LINKS.map((l, i) => (
                <motion.button
                  key={l.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.04, duration: 0.3 }}
                  onClick={() => navigateTo(l.id)}
                  className="body-ui"
                  style={{
                    fontSize: 13,
                    color: active === l.id ? "var(--gold-bright)" : "var(--text-light)",
                    opacity: active === l.id ? 1 : 0.75,
                    textAlign: "left",
                    padding: "14px 0",
                    borderBottom: "1px solid var(--line-on-dark)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    minHeight: 48,
                  }}
                >
                  <motion.span
                    animate={{ scale: active === l.id ? 1 : 0.4, opacity: active === l.id ? 1 : 0.25 }}
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 99,
                      background: "#E3B75B",
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  {tL(lang, "NAV", `links.${i}`)}
                </motion.button>
              ))}
              <motion.button
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + LINKS.length * 0.04, duration: 0.3 }}
                onClick={() => { setMenuOpen(false); window.location.href = "/map"; }}
                className="body-ui"
                style={{
                  fontSize: 13,
                  color: "var(--gold-bright)",
                  opacity: 0.9,
                  textAlign: "left",
                  padding: "14px 0",
                  borderBottom: "1px solid var(--line-on-dark)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  minHeight: 48,
                }}
              >
                <motion.span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 99,
                    background: "#E3B75B",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                {uiText(lang, "LANDING_MAP")}
              </motion.button>
            </div>
            <div role="group" aria-label={NAV[lang].langLabel} style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {LANG_OPTIONS.map((o) => (
                <button
                  key={o.code}
                  onClick={() => setUiLang(o.code)}
                  aria-pressed={lang === o.code}
                  className="body-ui"
                  style={{
                    fontSize: 11,
                    padding: "8px 14px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,.35)",
                    background: lang === o.code ? "var(--forest)" : "transparent",
                    color: "#fff",
                    opacity: lang === o.code ? 1 : 0.7,
                    cursor: "pointer",
                    minWidth: 44,
                    minHeight: 44,
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
              onClick={() => { setMenuOpen(false); window.location.href = "/assistant"; }}
              className="body-ui"
              style={{
                fontSize: 12,
                letterSpacing: ".2em",
                color: "#F3EFE2",
                background: "var(--ink)",
                border: "1px solid var(--line-on-dark)",
                borderRadius: 999,
                padding: "16px 24px",
                textAlign: "center",
                marginTop: 12,
                minHeight: 48,
              }}
            >
              {tL(lang, "NAV", "menuCta")}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function clampPx(min: number, max: number) {
  return `clamp(${min}px, ${((min + max) / 2) / 14.4}vw, ${max}px)`;
}
