"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useUiLang } from "@/lib/landing-strings";
import { uiText } from "@/lib/ui-strings";

export default function Sidebar({
  open,
  onClose,
  onLogout,
  loggedIn,
  email,
}: {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  loggedIn: boolean;
  email?: string | null;
}) {
  const lang = useUiLang();
  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(7,26,20,0.45)",
            backdropFilter: "blur(2px)",
            animation: "gi-fade 0.2s ease",
          }}
        />
      )}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 70,
          width: 264,
          background: "#fff",
          borderRight: "1px solid var(--line-on-light)",
          boxShadow: "12px 0 32px rgba(7,26,20,0.14)",
          transform: open ? "translateX(0)" : "translateX(-110%)",
          transition: "transform 0.28s cubic-bezier(.4,0,.2,1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid var(--line-on-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 18,
                fontStyle: "italic",
                fontWeight: 600,
                color: "var(--forest)",
              }}
            >
              GramIntel
            </span>
            <span
              className="body-ui"
              style={{ fontSize: 8, letterSpacing: ".18em", color: "rgba(20,35,28,0.45)" }}
            >
              PORTAL
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label={uiText(lang, "CLOSE")}
            style={{
              background: "var(--warm)",
              border: "1px solid var(--line-on-light)",
              borderRadius: 999,
              width: 30,
              height: 30,
              fontSize: 14,
              cursor: "pointer",
              color: "var(--text-dark)",
            }}
          >
            ✕
          </button>
        </div>

        {loggedIn && email && (
          <div
            style={{
              margin: "14px 16px 4px",
              padding: "10px 12px",
              background: "var(--warm)",
              border: "1px solid var(--line-on-light)",
              borderRadius: 12,
              fontSize: 11,
              color: "rgba(20,35,28,0.7)",
            }}
          >
            <span className="body-ui" style={{ fontSize: 9, letterSpacing: ".12em", color: "var(--forest)" }}>
              {uiText(lang, "OFFICER_PORTAL")}
            </span>
            <p style={{ marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {email}
            </p>
          </div>
        )}

        <nav style={{ padding: "8px 12px", display: "grid", gap: 4 }}>
          <SidebarLink href="/portal" onClick={onClose} active>{uiText(lang, "CASES")}</SidebarLink>
          <SidebarLink href="#ai-advisor" onClick={onClose}>{uiText(lang, "AI_CASE_ADVISOR")}</SidebarLink>
          <SidebarLink href="/assistant" onClick={onClose}>{uiText(lang, "APPLICANT_WORKSPACE")}</SidebarLink>
          <SidebarLink href="/" onClick={onClose}>{uiText(lang, "LANDING_PAGE")}</SidebarLink>
        </nav>

        <div style={{ flex: 1 }} />

        <div style={{ padding: 14, borderTop: "1px solid var(--line-on-light)" }}>
          {loggedIn ? (
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              style={{
                width: "100%",
                background: "#7f1d1d",
                color: "#fff",
                borderRadius: 999,
                padding: "10px 14px",
                fontSize: 12,
                letterSpacing: ".06em",
                cursor: "pointer",
                border: "none",
              }}
            >
              {uiText(lang, "LOGOUT")}
            </button>
          ) : (
            <p style={{ fontSize: 11, color: "rgba(20,35,28,0.45)", textAlign: "center" }}>
              {uiText(lang, "NOT_SIGNED_IN")}
            </p>
          )}
        </div>
      </aside>
    </>
  );
}

function SidebarLink({
  href,
  onClick,
  children,
  active,
}: {
  href: string;
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
}) {
  if (href.startsWith("#")) {
    return (
      <a
        href={href}
        onClick={(e) => {
          e.preventDefault();
          onClick();
          requestAnimationFrame(() => {
            document
              .getElementById(href.slice(1))
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        }}
        style={{
          display: "block",
          padding: "10px 14px",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: active ? 600 : 500,
          color: active ? "var(--forest)" : "var(--text-dark)",
          background: active ? "rgba(11,93,59,0.08)" : "transparent",
          textDecoration: "none",
          cursor: "pointer",
        }}
      >
        {children}
      </a>
    );
  }
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "block",
        padding: "10px 14px",
        borderRadius: 10,
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        color: active ? "var(--forest)" : "var(--text-dark)",
        background: active ? "rgba(11,93,59,0.08)" : "transparent",
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}
