"use client";

import Link from "next/link";
import { useState } from "react";
import { setUiLang, useUiLang } from "@/lib/landing-strings";
import { uiText } from "@/lib/ui-strings";

export default function MapHeader() {
  const [open, setOpen] = useState(false);
  const lang = useUiLang();
  const links = [
    { label: uiText(lang, "HOME"), href: "/" },
    { label: uiText(lang, "ASSISTANT"), href: "/assistant" },
    { label: uiText(lang, "MAP"), href: "/map" },
    { label: uiText(lang, "PORTAL"), href: "/portal" },
  ] as const;

  return (
    <header className="mx-header">
      <div className="mx-header-inner shell">
        <Link href="/" className="mx-wordmark" aria-label={`${uiText(lang, "HOME")} GramIntel`}>
          <span className="mx-wordmark-name">GramIntel</span>
          <span className="mx-wordmark-tag">MAP</span>
        </Link>
        <nav className="mx-nav" aria-label={uiText(lang, "PRIMARY_NAV")}>
          <div className="nav-links mx-nav-links">
            {links.map((l) =>
              l.href === "/map" ? (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current="page"
                  className="mx-navlink"
                >
                  {l.label}
                </Link>
              ) : (
                <Link key={l.href} href={l.href} className="mx-navlink">
                  {l.label}
                </Link>
              )
            )}
          </div>
          <div className="gi-lang-switcher" aria-label={uiText(lang, "LANGUAGE")}>
            {([["en", "EN"], ["hi", "हि"], ["te", "తె"], ["bn", "বাং"], ["mr", "म"], ["ta", "த"]] as const).map(([code, label]) => (
              <button key={code} type="button" onClick={() => setUiLang(code)} aria-pressed={lang === code}>
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="gi-hamburger"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? uiText(lang, "CLOSE") : uiText(lang, "PRIMARY_NAV")}
            aria-expanded={open}
            style={{
              display: "none",
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-dark)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {open ? (
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
      {open && (
        <div className="gi-mobile-menu">
          <nav aria-label={uiText(lang, "MOBILE_NAV")}>
            {links.map((l) =>
              l.href === "/map" ? (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current="page"
                  className="mx-mobile-link"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              ) : (
                <Link
                  key={l.href}
                  href={l.href}
                  className="mx-mobile-link"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              )
            )}
          </nav>
          <div className="gi-lang-switcher" aria-label={uiText(lang, "LANGUAGE")}>
            {([["en", "EN"], ["hi", "हि"], ["te", "తె"], ["bn", "বাং"], ["mr", "म"], ["ta", "த"]] as const).map(([code, label]) => (
              <button key={code} type="button" onClick={() => setUiLang(code)} aria-pressed={lang === code}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
