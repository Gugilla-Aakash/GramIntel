"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CaseChat from "@/components/portal/CaseChat";
import Sidebar from "@/components/portal/Sidebar";
import { setUiLang, useUiLang } from "@/lib/landing-strings";
import { categoryText, statusText, uiText } from "@/lib/ui-strings";
import { translateNarrative, type NarrativeLanguage } from "@/lib/narrative-translator";

function formatINR(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export default function PortalPage() {
  const lang = useUiLang();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [step, setStep] = useState<"request" | "verify">("request");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [cases, setCases] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [deciding, setDeciding] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [bannerType, setBannerType] = useState<"success" | "error">("error");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState<string | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("gramintel_token");
    const r = localStorage.getItem("gramintel_role");
    const e = localStorage.getItem("gramintel_email");
    if (t && r === "officer") {
      setToken(t); setRole(r); if (e) setEmail(e); setEmailAddress(e);
    }
  }, []);

  useEffect(() => {
    if (token) return;
    const cid = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!cid) return;
    const id = "gis-client";
    if (document.getElementById(id)) return;
    // @ts-ignore
    if ((window as any).__gis_initialized) return;
    const s = document.createElement("script");
    s.id = id;
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => {
      try {
        // @ts-ignore
        if (!window.google?.accounts?.id) return;
        // @ts-ignore
        if ((window as any).__gis_initialized) return;
        // @ts-ignore
        (window as any).__gis_initialized = true;
        // @ts-ignore
        window.google.accounts.id.initialize({
          client_id: cid,
          callback: async (resp: any) => {
            try {
              const r = await fetch("/api/backend/auth/oauth/google/id_token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: resp.credential, role: "officer" }),
              });
              const j = await r.json();
              if (!r.ok) throw new Error(uiText(lang, "GOOGLE_SIGNIN_FAILED"));
              if (j.role !== "officer") throw new Error(uiText(lang, "NOT_ADMIN"));
              persist(j.access_token, j.role, j.email);
            } catch {
              setErr(uiText(lang, "GOOGLE_SIGNIN_FAILED"));
            }
          },
          auto_select: false,
          cancel_on_tap_outside: false,
        });
        // @ts-ignore
        window.google.accounts.id.prompt();
      } catch (e) {
        console.warn("[GIS] init failed, fallback to redirect", e);
      }
    };
    s.onerror = () => console.warn("[GIS] gsi/client failed to load");
    document.head.appendChild(s);
  }, [token]);

  const persist = (tok: string, rl: string, em: string) => {
    localStorage.setItem("gramintel_token", tok);
    localStorage.setItem("gramintel_role", rl);
    localStorage.setItem("gramintel_email", em);
    setToken(tok); setRole(rl); setEmail(em); setEmailAddress(em);
  };
  const clear = () => { localStorage.removeItem("gramintel_token"); localStorage.removeItem("gramintel_role"); setToken(null); setRole(null); setEmailAddress(null); };

  const requestOtp = async () => {
    if (!email) { setErr(uiText(lang, "ENTER_EMAIL")); return; }
    setLoading(true); setErr("");
    try {
      const r = await fetch("/api/backend/auth/otp/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, role: "officer" }) });
      const j = await r.json();
      if (!r.ok) throw new Error(uiText(lang, "FAILED"));
      setStep("verify");
    } catch { setErr(uiText(lang, "FAILED")); }
    finally { setLoading(false); }
  };
  const verifyOtp = async () => {
    if (!otp) { setErr(uiText(lang, "ENTER_CODE")); return; }
    setLoading(true); setErr("");
    try {
      const r = await fetch("/api/backend/auth/otp/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code: otp }) });
      const j = await r.json();
      if (!r.ok) throw new Error(uiText(lang, "INVALID_CODE"));
      if (j.role !== "officer") throw new Error(uiText(lang, "NOT_ADMIN"));
      persist(j.access_token, j.role, email);
      setStep("request"); setOtp("");
    } catch { setErr(uiText(lang, "INVALID_CODE")); }
    finally { setLoading(false); }
  };

  const loadCases = async () => {
    if (!token) return;
    const url = filter ? `/api/backend/portal/cases?status=${filter}` : "/api/backend/portal/cases";
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) { const j = await r.json(); setCases(j.cases || []); }
    else if (r.status === 401 || r.status === 403) { setBanner(uiText(lang, "SESSION_EXPIRED")); clear(); }
  };
  useEffect(() => { if (token) loadCases(); }, [token, filter]);

  const narrativeLanguages = detail?.narratives?.map((n: any) => n.language).join("|") ?? "";
  useEffect(() => {
    const source = detail?.narratives?.find((n: any) => n.language === "en") || detail?.narratives?.[0];
    if (!detail || !source || detail.narratives?.some((n: any) => n.language === lang)) return;
    if (lang === "en") return;
    let cancelled = false;
    setNarrativeLoading(true);
    translateNarrative(source.content, lang as NarrativeLanguage)
      .then((translated) => {
        if (cancelled) return;
        setDetail((current: any) => {
          if (!current) return current;
          const narratives = (current.narratives || []).filter((n: any) => n.language !== lang);
          return {
            ...current,
            narratives: [...narratives, {
              language: lang,
              model: translated._model || "puter.js",
              content: translated,
            }],
          };
        });
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setNarrativeLoading(false); });
    return () => { cancelled = true; };
  }, [lang, detail?.case?.id, narrativeLanguages]);

  const openDetail = async (c: any) => {
    if (!token) return;
    setSelected(c); setDetail(null); setBanner(null); setBannerType("error");
    try {
      const r = await fetch(`/api/backend/cases/${c.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json();
      if (!r.ok) throw new Error(uiText(lang, "FAILED"));
      setDetail(j);
    } catch {
      setBanner(uiText(lang, "FAILED")); setBannerType("error"); setDetail(null);
    }
  };

  const decide = async (decision: "APPROVED" | "REJECTED") => {
    const targetId = (detail as any)?.case?.id ?? selected?.id;
    const curStatus = (detail as any)?.case?.status ?? selected?.status;
    if (!targetId || !token) { setBanner(uiText(lang, "SELECT_CASE_FIRST")); setBannerType("error"); return; }
    if (!detail) { setBanner(uiText(lang, "CASE_NOT_LOADED")); setBannerType("error"); return; }
    if (!decisionNote.trim()) { setBanner(uiText(lang, "NOTE_REQUIRED")); setBannerType("error"); return; }
    if (curStatus === "APPROVED" || curStatus === "REJECTED") { setBanner(uiText(lang, "ALREADY_FINAL", { status: statusText(lang, curStatus) })); setBannerType("error"); return; }
    if (curStatus === "DRAFT") { setBanner(uiText(lang, "DRAFT_CANNOT_DECIDE")); setBannerType("error"); return; }
    setDeciding(true); setBanner(null);
    try {
      const r = await fetch(`/api/backend/cases/${targetId}/decision`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ decision, note: decisionNote }) });
      const j = await r.json();
      if (!r.ok) throw new Error(uiText(lang, "DECISION_FAILED"));
      setBanner(uiText(lang, "HISTORY_UPDATED", { id: targetId, decision: decision === "APPROVED" ? uiText(lang, "APPROVE").toLowerCase() : uiText(lang, "REJECT").toLowerCase() })); setBannerType("success");
      try {
        const r2 = await fetch(`/api/backend/cases/${targetId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (r2.ok) { const j2 = await r2.json(); setDetail(j2); }
        else setDetail((d: any) => d ? { ...d, case: { ...d.case, status: j.status } } : d);
      } catch {}
      loadCases();
      setDecisionNote("");
    } catch { setBanner(uiText(lang, "DECISION_FAILED")); setBannerType("error"); }
    finally { setDeciding(false); }
  };

  const filtered = cases.filter((c) => {
    if (!q) return true;
    const s = `${c.village} ${c.business_category} ${c.district}`.toLowerCase();
    return s.includes(q.toLowerCase());
  });

  return (
    <div style={{ background: "var(--warm)", minHeight: "100vh", color: "var(--text-dark)" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(7,26,20,0.98)", borderBottom: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 1px 0 rgba(0,0,0,0.1)" }}>
        <div className="shell" style={{ height: 64, display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label={uiText(lang, "PRIMARY_NAV")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 38,
              height: 38,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              cursor: "pointer",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <Link href="/" style={{ display: "flex", alignItems: "baseline", gap: 8, color: "#fff" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontStyle: "italic", fontWeight: 600 }}>GramIntel</span>
            <span style={{ fontSize: 9, letterSpacing: ".2em", opacity: 0.5 }}>{uiText(lang, "OFFICER_PORTAL")}</span>
          </Link>
          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <Link href="/map" style={{ fontSize: 11, letterSpacing: ".1em", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "8px 14px", textDecoration: "none" }}>{uiText(lang, "MAP")}</Link>
            <Link href="/assistant" style={{ fontSize: 11, letterSpacing: ".1em", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "8px 14px", textDecoration: "none" }}>{uiText(lang, "APPLICANT_WORKSPACE")}</Link>
            <div aria-label={uiText(lang, "LANGUAGE")} style={{ display: "flex", gap: 3, alignItems: "center" }}>{([["en", "EN"], ["hi", "हि"], ["te", "తె"], ["bn", "বাং"], ["mr", "म"], ["ta", "த"]] as const).map(([code, label]) => <button key={code} type="button" onClick={() => setUiLang(code)} aria-pressed={lang === code} style={{ color: "#fff", background: lang === code ? "rgba(255,255,255,0.2)" : "transparent", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 999, padding: "6px 8px", fontSize: 10, cursor: "pointer" }}>{label}</button>)}</div>
            {token && <button onClick={clear} style={{ fontSize: 11, color: "#fff", background: "rgba(255,255,255,0.1)", borderRadius: 999, padding: "8px 14px", border: "1px solid rgba(255,255,255,0.16)", cursor: "pointer" }}>{uiText(lang, "LOGOUT")}</button>}
          </div>
        </div>
      </header>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={clear}
        loggedIn={!!token}
        email={emailAddress}
      />

      <main className="shell" style={{ paddingTop: 28, paddingBottom: 48 }}>
        {!token ? (
          <section style={{ maxWidth: 520, background: "#fff", border: "1px solid var(--line-on-light)", borderRadius: 16, padding: 20 }}>
            <p className="eyebrow" style={{ color: "var(--forest)" }}>{uiText(lang, "OFFICER_LOGIN")}</p>
            <h1 className="display-m" style={{ fontSize: 28, marginTop: 6 }}>{uiText(lang, "REVIEW_DECIDE")}</h1>
            <button onClick={() => (window.location.href = "/api/backend/auth/oauth/google/authorize?role=officer")} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#fff", border: "1px solid #dadce0", borderRadius: 999, padding: "11px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer", marginTop: 18, boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}>
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C34.7 33.1 30 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8.9 20-20 0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.1 18.9 14 24 14c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.2 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.4 0 10.3-2 13.7-5.2l-6.3-5.2C29.9 35.4 27.1 36 24 36c-6 0-10.7-2.9-11.7-7.1l-6.7 5.2C8.9 39.8 15.9 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.7-3.2 4.9-6 6.1l6.3 5.2c4.1-3.8 6.3-9.4 6.3-15.3 0-1.3-.1-2.3-.4-3.5z"/></svg>
              {uiText(lang, "GOOGLE_CONTINUE")}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "14px 0 2px" }}>
              <div style={{ flex: 1, height: 1, background: "var(--line-on-light)" }} />
              <span className="body-ui" style={{ fontSize: 10, color: "rgba(20,35,28,0.35)", letterSpacing: ".1em" }}>{uiText(lang, "OR_OTP")}</span>
              <div style={{ flex: 1, height: 1, background: "var(--line-on-light)" }} />
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <label className="body-ui" style={{ fontSize: 10, letterSpacing: ".1em" }}>{uiText(lang, "ADMIN_EMAIL")}</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" style={{ padding: "11px 12px", borderRadius: 12, border: "1px solid var(--line-on-light)", background: "var(--warm)" }} />
              {step === "request" ? (
                <button onClick={requestOtp} disabled={loading} style={{ background: "var(--ink)", color: "#fff", borderRadius: 999, padding: "12px 18px", fontSize: 12, letterSpacing: ".12em" }}>{loading ? uiText(lang, "SENDING") : uiText(lang, "SEND_OTP")}</button>
              ) : (
                <>
                  <label className="body-ui" style={{ fontSize: 10, letterSpacing: ".1em" }}>OTP</label>
                  <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder={uiText(lang, "SIX_DIGIT_CODE")} style={{ padding: "11px 12px", borderRadius: 12, border: "1px solid var(--line-on-light)", background: "var(--warm)" }} />
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={verifyOtp} disabled={loading} style={{ flex: 1, background: "var(--forest)", color: "#fff", borderRadius: 999, padding: "12px 18px", fontSize: 12, letterSpacing: ".12em" }}>{loading ? uiText(lang, "VERIFYING") : uiText(lang, "VERIFY")}</button>
                    <button onClick={() => setStep("request")} style={{ padding: "12px 16px", borderRadius: 999, border: "1px solid var(--line-on-light)", background: "#fff", fontSize: 12 }}>{uiText(lang, "BACK")}</button>
                  </div>
                </>
              )}
              {err && <p style={{ fontSize: 12, color: "#7f1d1d", background: "rgba(127,29,29,0.06)", padding: "8px 12px", borderRadius: 10 }}>{err}</p>}
              <p style={{ fontSize: 11, color: "rgba(20,35,28,0.45)" }}>{uiText(lang, "ADMIN_GOOGLE_HELP")}</p>
            </div>
          </section>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
              <h1 className="display-m" style={{ fontSize: 26 }}>{uiText(lang, "CASES")}</h1>
              <span className="body-ui" style={{ fontSize: 10, background: "var(--forest)", color: "#fff", padding: "4px 8px", borderRadius: 999 }}>{uiText(lang, "CASE_TOTAL", { n: cases.length })}</span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`${uiText(lang, "SEARCH_VILLAGE")} / ${uiText(lang, "BUSINESS_CATEGORY")}`} style={{ padding: "8px 12px", borderRadius: 999, border: "1px solid var(--line-on-light)", background: "#fff", fontSize: 12, minWidth: 180 }} />
                <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 999, border: "1px solid var(--line-on-light)", background: "#fff", fontSize: 12 }}>
                  <option value="">{uiText(lang, "ALL_STATUSES")}</option>
                  <option value="SUBMITTED">{statusText(lang, "SUBMITTED")}</option>
                  <option value="UNDER_REVIEW">{statusText(lang, "UNDER_REVIEW")}</option>
                  <option value="APPROVED">{statusText(lang, "APPROVED")}</option>
                  <option value="REJECTED">{statusText(lang, "REJECTED")}</option>
                  <option value="DRAFT">{statusText(lang, "DRAFT")}</option>
                </select>
                <button onClick={loadCases} style={{ padding: "8px 14px", borderRadius: 999, border: "1px solid var(--line-on-light)", background: "#fff", fontSize: 12 }}>{uiText(lang, "REFRESH")}</button>
              </div>
            </div>

            {banner && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 12, background: bannerType==="error" ? "rgba(185,28,28,0.06)" : "rgba(34,197,94,0.08)", border: bannerType==="error" ? "1px solid rgba(185,28,28,0.12)" : "1px solid rgba(34,197,94,0.18)", color: bannerType==="error" ? "#7f1d1d" : "#14532d", fontSize: 12 }}>{banner}</div>}

            <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ width: 300, maxWidth: "100%", flex: "0 0 auto", background: "#fff", border: "1px solid var(--line-on-light)", borderRadius: 16, overflow: "hidden", position: "sticky", top: 80, maxHeight: "calc(100vh - 100px)", display: "flex", flexDirection: "column", boxShadow: "0 1px 3px rgba(7,26,20,0.05)" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line-on-light)", display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="body-ui" style={{ fontSize: 10, letterSpacing: ".12em" }}>{uiText(lang, "QUEUE")}</span>
                  <span className="body-ui" style={{ marginLeft: "auto", fontSize: 10, color: "rgba(20,35,28,0.45)" }}>{filtered.length} {uiText(lang, "SHOWN")}</span>
                </div>
                <div style={{ flex: 1, overflow: "auto" }}>
                  {filtered.length === 0 ? (
                    <p style={{ padding: 16, fontSize: 12, color: "rgba(20,35,28,0.5)" }}>{uiText(lang, "NO_CASES_FILTER")}</p>
                  ) : filtered.map((c) => (
                    <button key={c.id} onClick={() => openDetail(c)} style={{ width: "100%", textAlign: "left", padding: "14px 16px", borderBottom: "1px solid var(--line-on-light)", background: selected?.id === c.id ? "var(--warm)" : "#fff", display: "grid", gap: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>#{c.id}</span>
                        <span className="body-ui" style={{ fontSize: 10, padding: "3px 8px", borderRadius: 999, background: c.status === "APPROVED" ? "var(--forest)" : c.status === "REJECTED" ? "#7f1d1d" : c.status === "SUBMITTED" ? "var(--gold)" : "#fff", color: c.status === "APPROVED" || c.status === "REJECTED" ? "#fff" : c.status === "SUBMITTED" ? "#071A14" : "var(--text-dark)", border: "1px solid var(--line-on-light)" }}>{statusText(lang, c.status)}</span>
                        <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(20,35,28,0.45)" }}>{new Date(c.created_at).toLocaleDateString("en-IN")}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(20,35,28,0.7)" }}>{c.village} · {c.block} · {categoryText(lang, c.business_category)} · {formatINR(c.margin_capital)} {uiText(lang, "MARGIN")}</div>
                      <div style={{ fontSize: 11, color: "rgba(20,35,28,0.45)" }}>{c.scheme ? `${c.scheme} · ${formatINR(c.project_cost || 0)} ${uiText(lang, "PROJECT")}` : ""}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ flex: "1 1 320px", minWidth: 0 }}>
                {!selected ? (
                  <div style={{ background: "#fff", border: "1px dashed var(--line-on-light)", borderRadius: 16, padding: 24, textAlign: "center", color: "rgba(20,35,28,0.5)", fontSize: 13 }}>{uiText(lang, "SELECT_CASE")}</div>
                ) : !detail ? (
                  <div style={{ background: "#fff", border: "1px solid var(--line-on-light)", borderRadius: 16, padding: 24, fontSize: 12 }}>{uiText(lang, "LOADING")}</div>
                ) : (
                  <div style={{ display: "grid", gap: 16 }}>
                    <div style={{ background: "#fff", border: "1px solid var(--line-on-light)", borderRadius: 16, padding: 16, boxShadow: "0 1px 3px rgba(7,26,20,0.05)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontWeight: 700 }}>Case #{detail.case.id}</span>
                        <span className="body-ui" style={{ fontSize: 10, padding: "4px 8px", borderRadius: 999, background: detail.case.status === "APPROVED" ? "var(--forest)" : detail.case.status === "REJECTED" ? "#7f1d1d" : "#F3EFE2", color: detail.case.status === "APPROVED" || detail.case.status === "REJECTED" ? "#fff" : "var(--text-dark)", border: "1px solid var(--line-on-light)" }}>{statusText(lang, detail.case.status)}</span>
                        <button onClick={() => setSelected(null)} style={{ marginLeft: "auto", fontSize: 11, padding: "6px 10px", borderRadius: 999, border: "1px solid var(--line-on-light)", background: "var(--warm)" }}>{uiText(lang, "CLOSE")}</button>
                      </div>
                      <p style={{ fontSize: 12, color: "rgba(20,35,28,0.6)", marginTop: 6 }}>{detail.case.village} · {detail.case.block} · {detail.case.district} · {categoryText(lang, detail.case.business_category)} · {uiText(lang, "MARGIN")} {formatINR(detail.case.margin_capital)}</p>
                      {detail.feasibility_report && (
                        <>
                          {detail.feasibility_report.dataset_integration && (
                            <div style={{
                              marginTop: 10,
                              fontSize: 10,
                              padding: "6px 10px",
                              borderRadius: 8,
                              background: detail.feasibility_report.dataset_integration.status === "actual_data" ? "rgba(11,93,59,0.08)" : "rgba(227,183,91,0.12)",
                              color: detail.feasibility_report.dataset_integration.status === "actual_data" ? "var(--forest)" : "#8a6a2f",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}>
                              <span style={{ fontWeight: 600 }}>{detail.feasibility_report.dataset_integration.status === "actual_data" ? `✓ ${uiText(lang, "VERIFIED_RECORD")}` : `ⓘ ${uiText(lang, "FALLBACK_RECORD")}`}</span>
                              <span>{detail.feasibility_report.dataset_integration.demographics_source} {detail.feasibility_report.dataset_integration.population ? `(${detail.feasibility_report.dataset_integration.population.toLocaleString()} ${uiText(lang, "POPULATION")})` : ""}</span>
                            </div>
                          )}
                          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <div style={{ background: "var(--warm)", border: "1px solid var(--line-on-light)", borderRadius: 12, padding: 12 }}>
                              <p className="body-ui" style={{ fontSize: 9, letterSpacing: ".1em" }}>{uiText(lang, "MARKET_REACH")}</p>
                              <p style={{ fontSize: 11, marginTop: 4 }}>{detail.feasibility_report.market_reach.estimated_consumers.toLocaleString()} {uiText(lang, "BUSINESS")} · {detail.feasibility_report.competitor_map.count} {uiText(lang, "NEARBY_COMPETITORS")}</p>
                            </div>
                            <div style={{ background: "var(--warm)", border: "1px solid var(--line-on-light)", borderRadius: 12, padding: 12 }}>
                              <p className="body-ui" style={{ fontSize: 9, letterSpacing: ".1em" }}>{uiText(lang, "VIABILITY")}</p>
                              <p style={{ fontSize: 11, marginTop: 4 }}>{detail.feasibility_report.viability.score}/100 · {detail.feasibility_report.viability.grade}</p>
                            </div>
                          </div>
                        </>
                      )}
                      {detail.financial_plan && (
                        <div style={{ marginTop: 12, background: "var(--ink)", color: "var(--text-light)", borderRadius: 12, padding: 12, fontSize: 11 }}>
                          <div>{detail.financial_plan.scheme} · {detail.financial_plan.interest_rate}% · {detail.financial_plan.tenure_months}mo · {uiText(lang, "MORATORIUM")} {detail.financial_plan.moratorium_months}mo</div>
                          <div style={{ marginTop: 4, display: "flex", gap: 12 }}>{formatINR(detail.financial_plan.project_cost)} {uiText(lang, "PROJECT")} · {formatINR(detail.financial_plan.max_loan)} {uiText(lang, "LOAN")} · {formatINR(detail.financial_plan.emi_monthly)}{uiText(lang, "MONTH")} · {formatINR(detail.financial_plan.emi_quarterly)}{uiText(lang, "QUARTER")}</div>
                        </div>
                      )}
                    </div>

                    {((detail.narratives?.find((n: any) => n.language === lang)) || narrativeLoading) && (
                      <div style={{ background: "#fff", border: "1px solid var(--line-on-light)", borderRadius: 16, padding: 16, boxShadow: "0 1px 3px rgba(7,26,20,0.05)" }}>
                        <p className="body-ui" style={{ fontSize: 10, letterSpacing: ".1em" }}>{uiText(lang, "NARRATIVES")}</p>
                        {(() => {
                          const n = detail.narratives?.find((item: any) => item.language === lang);
                          if (!n) return <p style={{ marginTop: 10, color: "rgba(20,35,28,0.5)" }}>{uiText(lang, "LOADING")}</p>;
                          return (
                            <div style={{ marginTop: 10, background: "var(--warm)", border: "1px solid var(--line-on-light)", borderRadius: 12, padding: 12, fontSize: 11 }}>
                              <span className="body-ui" style={{ fontSize: 10, background: "var(--forest)", color: "#fff", padding: "2px 8px", borderRadius: 999 }}>{n.language.toUpperCase()}</span> <span style={{ marginLeft: 6, fontSize: 10, color: "rgba(20,35,28,0.4)" }}>{n.model}</span>
                              <p style={{ marginTop: 6, lineHeight: 1.5 }}>{typeof n.content === "string" ? n.content : n.content.vernacular_summary || JSON.stringify(n.content).slice(0, 300)}</p>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    <div style={{ background: "#fff", border: "1px solid var(--line-on-light)", borderRadius: 16, padding: 16, boxShadow: "0 1px 3px rgba(7,26,20,0.05)" }}>
                      <p className="body-ui" style={{ fontSize: 10, letterSpacing: ".1em" }}>{uiText(lang, "STATUS_HISTORY")}</p>
                      <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                        {detail.status_history?.map((h: any) => (
                          <div key={h.id} style={{ display: "flex", gap: 10, fontSize: 11, background: "var(--warm)", border: "1px solid var(--line-on-light)", borderRadius: 10, padding: "8px 10px" }}>
                            <span style={{ color: "rgba(20,35,28,0.45)" }}>{new Date(h.created_at).toLocaleString("en-IN")}</span>
                            <span>{h.from_status ? statusText(lang, h.from_status) : "—"} → <strong>{statusText(lang, h.to_status)}</strong></span>
                            <span style={{ marginLeft: "auto", color: "rgba(20,35,28,0.5)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.note || ""}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: "#fff", border: "1px solid var(--line-on-light)", borderRadius: 16, padding: 16, boxShadow: "0 1px 3px rgba(7,26,20,0.05)" }}>
                      <p className="body-ui" style={{ fontSize: 10, letterSpacing: ".1em" }}>{uiText(lang, "DECISION")}</p>
                      <textarea value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} placeholder={uiText(lang, "DECISION_NOTE")} rows={3} style={{ width: "100%", marginTop: 8, padding: 10, borderRadius: 10, border: "1px solid var(--line-on-light)", background: "var(--warm)", fontSize: 12, resize: "vertical" }} />
                      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                        <button onClick={() => decide("APPROVED")} disabled={deciding} style={{ flex: 1, background: "var(--forest)", color: "#fff", borderRadius: 999, padding: "10px 14px", fontSize: 12, letterSpacing: ".08em", opacity: deciding ? 0.6 : 1 }}>{uiText(lang, "APPROVE")}</button>
                        <button onClick={() => decide("REJECTED")} disabled={deciding} style={{ flex: 1, background: "#7f1d1d", color: "#fff", borderRadius: 999, padding: "10px 14px", fontSize: 12, letterSpacing: ".08em", opacity: deciding ? 0.6 : 1 }}>{uiText(lang, "REJECT")}</button>
                      </div>
                      <p style={{ fontSize: 10, color: "rgba(20,35,28,0.4)", marginTop: 6 }}>{uiText(lang, "TRANSITIONS")}</p>
                    </div>
                  </div>
                )}
              </div>

              {selected && detail && (
                <div id="ai-advisor" style={{ width: 380, maxWidth: "100%", flex: "0 0 auto", position: "sticky", top: 80, height: "calc(100vh - 100px)" }}>
                  <CaseChat
                    caseId={detail.case?.id ?? selected.id}
                    token={token}
                    detail={detail}
                    language={lang}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
