"use client";

import Link from "next/link";
import { SectionLabel } from "@/components/primitives/SectionLabel";
import { useUiLang } from "@/lib/landing-strings";
import { uiText } from "@/lib/ui-strings";
import { t } from "@/lib/assistant-strings";
import type { UiLang } from "@/lib/assistant-strings";
import { LEGAL_SECTIONS, LEGAL_SIGN_TABLE } from "@/lib/legal-content";

export default function LegalPage() {
  const lang = useUiLang();
  return (
    <div style={{ background: "var(--warm)", minHeight: "100vh", color: "var(--text-dark)" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(7,26,20,0.92)", borderBottom: "1px solid var(--line-on-dark)" }}>
        <div className="shell" style={{ height: 64, display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ display: "flex", alignItems: "baseline", gap: 8, color: "#fff" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontStyle: "italic", fontWeight: 600 }}>GramIntel</span>
            <span style={{ fontSize: 9, letterSpacing: ".2em", opacity: 0.5 }}>{uiText(lang, "LEGAL")}</span>
          </Link>
          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <Link href="/assistant" style={{ fontSize: 11, letterSpacing: ".1em", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "8px 14px", textDecoration: "none" }}>{uiText(lang, "APPLICANT_WORKSPACE")}</Link>
            <Link href="/portal" style={{ fontSize: 11, letterSpacing: ".1em", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "8px 14px", textDecoration: "none" }}>{uiText(lang, "OFFICER_PORTAL")}</Link>
          </div>
        </div>
      </header>

      <main className="shell" style={{ paddingTop: 32, paddingBottom: 64, maxWidth: 860 }}>
        <SectionLabel index="§" title="LEGAL DOCUMENT" />
        <p className="body-ui no-print" style={{ fontSize: 11, color: "rgba(20,35,28,0.5)", marginTop: 12 }}>
          {uiText(lang, "LEGAL_NOTE")}
        </p>
        <button onClick={() => window.print()} className="body-ui no-print" style={{ marginTop: 12, fontSize: 11, padding: "8px 16px", borderRadius: 999, border: "1px solid var(--forest)", color: "var(--forest)", background: "#fff", letterSpacing: ".08em", cursor: "pointer" }}>
          {t(lang as UiLang, "BTN_PRINT")}
        </button>

        <article style={{ marginTop: 24, background: "#fff", border: "1px solid var(--line-on-light)", borderRadius: 20, padding: "clamp(20px, 4vw, 44px)", boxShadow: "0 8px 40px rgba(20,35,28,0.06)" }}>
          {LEGAL_SECTIONS.map((s, i) => (
            <section key={i} style={{ marginBottom: 22 }}>
              {s.h && (
                s.h === "IMPORTANT LEGAL NOTE" ? (
                  <div style={{ background: "rgba(185,28,28,0.06)", border: "1px solid rgba(185,28,28,0.16)", borderRadius: 12, padding: "14px 16px" }}>
                    <p className="body-ui" style={{ fontSize: 11, letterSpacing: ".12em", color: "#991b1b", marginBottom: 6 }}>{s.h}</p>
                    {s.body.map((t, j) => <p key={j} style={{ fontSize: 12, lineHeight: 1.7, color: "rgba(20,35,28,0.75)" }}>{t}</p>)}
                  </div>
                ) : (
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: 19, marginBottom: 8 }}>{s.h}</h2>
                )
              )}
              {s.h !== "IMPORTANT LEGAL NOTE" && s.body.map((t, j) => (
                <p key={j} style={{ fontSize: s.h === null && j < 2 ? 15 : 13, fontWeight: s.h === null && j < 2 ? 700 : 400, lineHeight: 1.7, marginBottom: 8, color: s.h === null && j < 2 ? "var(--text-dark)" : "rgba(20,35,28,0.78)", textAlign: s.h === null && j < 2 ? "center" : "left" }}>{t}</p>
              ))}
            </section>
          ))}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 8 }}>
            {[LEGAL_SIGN_TABLE.left, LEGAL_SIGN_TABLE.right].map((col, i) => (
              <div key={i} style={{ border: "1px solid var(--line-on-light)", borderRadius: 12, padding: 16, background: "var(--warm)" }}>
                {col.map((t, j) => <p key={j} style={{ fontSize: 12, lineHeight: 2, color: "rgba(20,35,28,0.75)" }}>{t}</p>)}
              </div>
            ))}
          </div>
        </article>
      </main>
    </div>
  );
}
