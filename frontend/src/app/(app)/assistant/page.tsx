"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { searchPlaces } from "@/lib/geocode";
import CaseChat from "@/components/portal/CaseChat";
import { t, tdyn, DATA, CATEGORIES as CATEGORY_LABELS, isWarmBanner, STRINGS, UI_LANG_CODES, isUiLang, type UiLang } from "@/lib/assistant-strings";
import { setUiLang } from "@/lib/landing-strings";
import { categoryText, statusText, uiText } from "@/lib/ui-strings";
import { translateNarrative, type NarrativeLanguage } from "@/lib/narrative-translator";

const CATEGORIES = ["Dairy", "Retail", "Textile", "Food Processing", "Poultry", "Kirana", "Services", "Food"] as const;
const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "hi", label: "हि" },
  { code: "te", label: "తె" },
  { code: "bn", label: "বাং" },
  { code: "mr", label: "म" },
  { code: "ta", label: "த" },
] as const;

function formatINR(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

type AnalyzeResponse = {
  case_id: number;
  feasibility_report: any;
  financial_plan: any;
  narrative: any;
  source: string;
};

export default function AssistantPage() {
  return (
    <Suspense>
      <AssistantInner />
    </Suspense>
  );
}

function AssistantInner() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [authStep, setAuthStep] = useState<"request" | "verify">("request");
  const [authLoading, setAuthLoading] = useState(false);
  const [authErr, setAuthErr] = useState("");

  const [village, setVillage] = useState("Gandipet");
  const [block, setBlock] = useState("Gandipet");
  const [district, setDistrict] = useState("Hyderabad");
  const [margin, setMargin] = useState("100000");
  const [category, setCategory] = useState("Dairy");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [narrativeLang, setNarrativeLang] = useState("en");
  const [narrativeData, setNarrativeData] = useState<any>(null);
  const [narrLoading, setNarrLoading] = useState(false);
  const [applyState, setApplyState] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [applyMsg, setApplyMsg] = useState("");
  const [myCases, setMyCases] = useState<any[]>([]);
  const [openChatId, setOpenChatId] = useState<number | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("gramintel_token");
    const r = localStorage.getItem("gramintel_role");
    const e = localStorage.getItem("gramintel_email");
    if (t && r === "applicant") {
      setToken(t);
      setRole(r);
      if (e) setEmail(e);
    }
    const ul = localStorage.getItem("gramintel_ui_lang");
    if (ul && isUiLang(ul)) {
      setLanguage(ul);
      setNarrativeLang(ul);
    }
  }, []);

  useEffect(() => {
    const v = searchParams.get("village");
    if (v) { setVillage(v); setBlock(v); }
    const b = searchParams.get("block");
    if (b) setBlock(b);
    const d = searchParams.get("district");
    if (d) setDistrict(d);
    const m = searchParams.get("margin");
    if (m && /^\d+$/.test(m)) setMargin(m);
    const c = searchParams.get("category");
    if (c && (CATEGORIES as readonly string[]).includes(c)) setCategory(c);
    const lang = searchParams.get("language");
    if (lang && isUiLang(lang)) setLanguage(lang);
  }, [searchParams]);

  useEffect(() => {
    setBanner((prev) => {
      if (!prev) return prev;
      for (const k of ["BANNER_DEMO", "BANNER_LOCATING", "MSG_FILL_LOCATION", "MSG_BAD_MARGIN", "MSG_LOGIN_FIRST"] as const) {
        if (UI_LANG_CODES.some((l) => STRINGS[l][k] === prev)) {
          return t(language as UiLang, k);
        }
      }
      return prev;
    });
  }, [language]);

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
                body: JSON.stringify({ credential: resp.credential, role: "applicant" }),
              });
              const j = await r.json();
              if (!r.ok) throw new Error(uiText(language as UiLang, "GOOGLE_SIGNIN_FAILED"));
              persistAuth(j.access_token, j.role, j.email);
            } catch {
              setAuthErr(uiText(language as UiLang, "GOOGLE_SIGNIN_FAILED"));
            }
          },
          auto_select: false,
          cancel_on_tap_outside: false,
        });
        // @ts-ignore
        window.google.accounts.id.prompt();
      } catch (e) {
        console.warn("[GIS] init failed", e);
      }
    };
    s.onerror = () => console.warn("[GIS] gsi/client failed to load");
    document.head.appendChild(s);
  }, [token]);

  const persistAuth = (tok: string, rl: string, em: string) => {
    localStorage.setItem("gramintel_token", tok);
    localStorage.setItem("gramintel_role", rl);
    localStorage.setItem("gramintel_email", em);
    setToken(tok);
    setRole(rl);
    setEmail(em);
  };

  const clearAuth = () => {
    localStorage.removeItem("gramintel_token");
    localStorage.removeItem("gramintel_role");
    setToken(null);
    setRole(null);
  };

  const requestOtp = async () => {
    if (!email) { setAuthErr(uiText(language as UiLang, "ENTER_EMAIL")); return; }
    setAuthLoading(true); setAuthErr("");
    try {
      const r = await fetch("/api/backend/auth/otp/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, role: "applicant" }) });
      const j = await r.json();
      if (!r.ok) throw new Error(uiText(language as UiLang, "FAILED"));
      setAuthStep("verify");
    } catch { setAuthErr(uiText(language as UiLang, "FAILED")); }
    finally { setAuthLoading(false); }
  };

  const verifyOtp = async () => {
    if (!otp) { setAuthErr(uiText(language as UiLang, "ENTER_CODE")); return; }
    setAuthLoading(true); setAuthErr("");
    try {
      const r = await fetch("/api/backend/auth/otp/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code: otp }) });
      const j = await r.json();
      if (!r.ok) throw new Error(uiText(language as UiLang, "INVALID_CODE"));
      persistAuth(j.access_token, j.role, email);
      setAuthStep("request");
      setOtp("");
    } catch { setAuthErr(uiText(language as UiLang, "INVALID_CODE")); }
    finally { setAuthLoading(false); }
  };

  const fetchMyCases = async (tok: string) => {
    try {
      const r = await fetch("/api/backend/applicant/me/cases", { headers: { Authorization: `Bearer ${tok}` } });
      if (r.ok) { const j = await r.json(); setMyCases(j.cases || []); }
    } catch {}
  };

  useEffect(() => { if (token) fetchMyCases(token); }, [token, result]);

  const analyze = async () => {
    const m = parseInt(margin, 10);
    if (!village || !block || !district) { setBanner(t(language as UiLang, "MSG_FILL_LOCATION")); return; }
    if (!m || m <= 0) { setBanner(t(language as UiLang, "MSG_BAD_MARGIN")); return; }
    if (!token) { setBanner(t(language as UiLang, "MSG_LOGIN_FIRST")); return; }
    setLoading(true); setBanner(t(language as UiLang, "BANNER_LOCATING")); setResult(null); setNarrativeData(null); setApplyState("idle");
    try {
      let lat: number | undefined;
      let lng: number | undefined;
      try {
        const g = await searchPlaces(`${village}, ${district}`);
        if (g[0] && Number.isFinite(g[0].lat) && Number.isFinite(g[0].lng)) { lat = g[0].lat; lng = g[0].lng; }
      } catch {}
      const payload: Record<string, unknown> = { village, block, district, margin_capital: m, business_category: category, language };
      if (lat !== undefined && lng !== undefined) { payload.lat = lat; payload.lng = lng; }
      const r = await fetch("/api/backend/assistant/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(uiText(language as UiLang, "FAILED"));
      setResult(j);
      setNarrativeData(j.narrative || null);
      setNarrativeLang(language);
      if (j.source === "seeded") setBanner(t(language as UiLang, "BANNER_DEMO"));
      else if (j.feasibility_report?.source === "seeded") setBanner(t(language as UiLang, "BANNER_DEMO"));
      else setBanner(null);
    } catch (e: any) {
      setBanner(uiText(language as UiLang, "FAILED"));
    } finally { setLoading(false); }
  };

  const switchNarrative = async (lang: string) => {
    if (!result?.narrative) return;
    setNarrLang(lang); setNarrLoading(true);
    try {
      const translated = await translateNarrative(result.narrative, lang as NarrativeLanguage);
      setNarrativeData(translated);
    } catch { setNarrativeData(lang === "en" ? result.narrative : null); }
    finally { setNarrLoading(false); }
  };

  const setNarrLang = (l: string) => setNarrativeLang(l);

  const apply = async () => {
    if (!result || !token) return;
    setApplyState("submitting"); setApplyMsg("");
    try {
      const r = await fetch("/api/backend/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ case_id: result.case_id }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(uiText(language as UiLang, "FAILED"));
      setApplyState("done"); setApplyMsg(t(language as UiLang, "APPLY_DONE").replace("{id}", String(result.case_id)));
      fetchMyCases(token);
    } catch { setApplyState("error"); setApplyMsg(uiText(language as UiLang, "FAILED")); }
  };

  return (
    <div style={{ background: "var(--warm)", minHeight: "100vh", color: "var(--text-dark)" }}>
      <header className="no-print" style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(7,26,20,0.92)", borderBottom: "1px solid var(--line-on-dark)", backdropFilter: "blur(8px)" }}>
        <div className="shell" style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "baseline", gap: 8, color: "#fff" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontStyle: "italic", fontWeight: 600 }}>GramIntel</span>
            <span style={{ fontSize: 9, letterSpacing: ".2em", opacity: 0.5 }}>{uiText(language as UiLang, "ASSISTANT")}</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/map" style={{ fontSize: 11, letterSpacing: ".12em", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "8px 14px" }}>{uiText(language as UiLang, "MAP")}</Link>
            <Link href="/portal" style={{ fontSize: 11, letterSpacing: ".12em", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "8px 14px" }}>{uiText(language as UiLang, "OFFICER_PORTAL")}</Link>
            <div aria-label={uiText(language as UiLang, "LANGUAGE")} style={{ display: "flex", gap: 3 }}>{LANGUAGES.map(({ code, label }) => <button key={code} type="button" onClick={() => { setLanguage(code); setUiLang(code); if (result && token) switchNarrative(code); else setNarrLang(code); }} aria-pressed={language === code} style={{ color: "#fff", background: language === code ? "rgba(255,255,255,0.2)" : "transparent", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 999, padding: "6px 8px", fontSize: 10, cursor: "pointer" }}>{label}</button>)}</div>
            {token ? (
              <button onClick={clearAuth} style={{ fontSize: 11, letterSpacing: ".08em", color: "#fff", background: "rgba(255,255,255,0.08)", borderRadius: 999, padding: "8px 14px", border: "1px solid rgba(255,255,255,0.12)" }}>{uiText(language as UiLang, "LOGOUT")}</button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="shell" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div style={{ maxWidth: 760 }}>
          <p className="eyebrow" style={{ color: "var(--forest)" }}>{t(language as UiLang, "APP_EYEBROW")}</p>
          <h1 className="display-m" style={{ marginTop: 8 }}>{t(language as UiLang, "APP_TITLE_A")}<span className="serif-i" style={{ color: "var(--forest)" }}>{t(language as UiLang, "APP_TITLE_B")}</span></h1>
          <p className="body-lg" style={{ color: "var(--muted-on-light)", marginTop: 12, maxWidth: 640 }}>
            {t(language as UiLang, "APP_SUB")}
          </p>
        </div>

        {!token ? (
          <section className="no-print" style={{ marginTop: 28, maxWidth: 560, background: "#fff", border: "1px solid var(--line-on-light)", borderRadius: 16, padding: 20, boxShadow: "0 4px 24px rgba(20,35,28,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: "#22c55e", display: "inline-block" }} />
              <span className="body-ui" style={{ fontSize: 11, letterSpacing: ".14em", color: "var(--text-dark)" }}>{t(language as UiLang, "LOGIN_TITLE")}</span>
              <span className="body-ui" style={{ marginLeft: "auto", fontSize: 10, color: "rgba(20,35,28,0.4)", background: "var(--warm)", border: "1px solid var(--line-on-light)", padding: "4px 8px", borderRadius: 999 }}>{t(language as UiLang, "LOGIN_SECURE")}</span>
            </div>
            <button onClick={() => (window.location.href = "/api/backend/auth/oauth/google/authorize?role=applicant")} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#fff", border: "1px solid #dadce0", borderRadius: 999, padding: "11px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}>
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C34.7 33.1 30 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8.9 20-20 0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.1 18.9 14 24 14c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.2 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.4 0 10.3-2 13.7-5.2l-6.3-5.2C29.9 35.4 27.1 36 24 36c-6 0-10.7-2.9-11.7-7.1l-6.7 5.2C8.9 39.8 15.9 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.7-3.2 4.9-6 6.1l6.3 5.2c4.1-3.8 6.3-9.4 6.3-15.3 0-1.3-.1-2.3-.4-3.5z"/></svg>
              {t(language as UiLang, "LOGIN_GOOGLE")}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "14px 0 2px" }}>
              <div style={{ flex: 1, height: 1, background: "var(--line-on-light)" }} />
              <span className="body-ui" style={{ fontSize: 10, color: "rgba(20,35,28,0.35)", letterSpacing: ".1em" }}>{t(language as UiLang, "LOGIN_OR_OTP")}</span>
              <div style={{ flex: 1, height: 1, background: "var(--line-on-light)" }} />
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <label className="body-ui" style={{ fontSize: 11, letterSpacing: ".08em" }}>{t(language as UiLang, "LOGIN_EMAIL")}</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid var(--line-on-light)", background: "var(--warm)", outline: "none" }} />
              {authStep === "request" ? (
                <button onClick={requestOtp} disabled={authLoading} style={{ marginTop: 4, background: "var(--forest)", color: "#fff", borderRadius: 999, padding: "12px 18px", fontSize: 12, letterSpacing: ".12em", opacity: authLoading ? 0.6 : 1 }}>
                  {authLoading ? t(language as UiLang, "LOGIN_SENDING") : t(language as UiLang, "LOGIN_SEND_OTP")}
                </button>
              ) : (
                <>
                  <label className="body-ui" style={{ fontSize: 11, letterSpacing: ".08em" }}>{t(language as UiLang, "LOGIN_OTP")}</label>
                  <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder={uiText(language as UiLang, "SIX_DIGIT_CODE")} style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid var(--line-on-light)", background: "var(--warm)", outline: "none" }} />
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={verifyOtp} disabled={authLoading} style={{ flex: 1, background: "var(--forest)", color: "#fff", borderRadius: 999, padding: "12px 18px", fontSize: 12, letterSpacing: ".12em" }}>{authLoading ? t(language as UiLang, "LOGIN_VERIFYING") : t(language as UiLang, "LOGIN_VERIFY")}</button>
                    <button onClick={() => setAuthStep("request")} style={{ padding: "12px 16px", borderRadius: 999, border: "1px solid var(--line-on-light)", background: "#fff", fontSize: 12 }}>{t(language as UiLang, "LOGIN_BACK")}</button>
                  </div>
                </>
              )}
              {authErr && <p style={{ fontSize: 12, color: "#b91c1c", background: "rgba(185,28,28,0.06)", padding: "8px 12px", borderRadius: 10 }}>{authErr}</p>}
              <p style={{ fontSize: 11, color: "rgba(20,35,28,0.45)", lineHeight: 1.5 }}>{uiText(language as UiLang, "OTP_HELP")}</p>
            </div>
          </section>
        ) : (
          <div style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(11,93,59,0.06)", border: "1px solid rgba(11,93,59,0.14)", borderRadius: 999, padding: "8px 14px" }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--forest)" }} />
            <span className="body-ui" style={{ fontSize: 11, letterSpacing: ".06em" }}>{email}</span>
            <span className="body-ui" style={{ fontSize: 10, color: "var(--forest)", background: "#fff", padding: "3px 8px", borderRadius: 999, border: "1px solid rgba(11,93,59,0.12)" }}>{role}</span>
          </div>
        )}

        <section className="no-print" style={{ marginTop: 28, background: "#fff", border: "1px solid var(--line-on-light)", borderRadius: 20, padding: "24px 22px", boxShadow: "0 8px 40px rgba(20,35,28,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <h2 className="body-ui" style={{ fontSize: 11, letterSpacing: ".14em" }}>{t(language as UiLang, "INPUTS_TITLE")}</h2>
            <span className="body-ui" style={{ marginLeft: "auto", fontSize: 10, color: "rgba(20,35,28,0.4)", background: "var(--warm)", padding: "4px 8px", borderRadius: 999, border: "1px solid var(--line-on-light)" }}>{t(language as UiLang, "INPUTS_PS_NOTE")}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <label className="body-ui" style={{ fontSize: 10, letterSpacing: ".1em" }}>{t(language as UiLang, "F_VILLAGE")}</label>
              <input value={village} onChange={(e) => setVillage(e.target.value)} placeholder="Gandipet" style={{ padding: "11px 12px", borderRadius: 12, border: "1px solid var(--line-on-light)", background: "var(--warm)" }} />
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              <label className="body-ui" style={{ fontSize: 10, letterSpacing: ".1em" }}>{t(language as UiLang, "F_BLOCK")}</label>
              <input value={block} onChange={(e) => setBlock(e.target.value)} placeholder="Gandipet" style={{ padding: "11px 12px", borderRadius: 12, border: "1px solid var(--line-on-light)", background: "var(--warm)" }} />
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              <label className="body-ui" style={{ fontSize: 10, letterSpacing: ".1em" }}>{t(language as UiLang, "F_DISTRICT")}</label>
              <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Hyderabad" style={{ padding: "11px 12px", borderRadius: 12, border: "1px solid var(--line-on-light)", background: "var(--warm)" }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <label className="body-ui" style={{ fontSize: 10, letterSpacing: ".1em" }}>{t(language as UiLang, "F_MARGIN")}</label>
              <input value={margin} onChange={(e) => setMargin(e.target.value)} placeholder="100000" inputMode="numeric" style={{ padding: "11px 12px", borderRadius: 12, border: "1px solid var(--line-on-light)", background: "var(--warm)" }} />
              <span style={{ fontSize: 11, color: "rgba(20,35,28,0.45)" }}>{t(language as UiLang, "F_MARGIN_HINT")} {margin ? formatINR(parseInt(margin || "0", 10) / 0.1 || 0) : "—"}</span>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              <label className="body-ui" style={{ fontSize: 10, letterSpacing: ".1em" }}>{t(language as UiLang, "F_CATEGORY")}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: "11px 12px", borderRadius: 12, border: "1px solid var(--line-on-light)", background: "var(--warm)" }}>
                {CATEGORIES.map((c, i) => <option key={c} value={c}>{CATEGORY_LABELS[language as UiLang]?.[i] ?? c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
            <select
              value={language}
              onChange={(e) => {
                const v = e.target.value as UiLang;
                setLanguage(v);
                try { localStorage.setItem("gramintel_ui_lang", v); window.dispatchEvent(new CustomEvent("gi-lang", { detail: v })); } catch {}
                if (result && token) switchNarrative(v); else setNarrLang(v);
              }}
              className="body-ui"
              style={{ fontSize: 12, padding: "8px 12px", borderRadius: 999, border: "1px solid var(--line-on-light)", background: "#fff", color: "var(--text-dark)", cursor: "pointer", outline: "none" }}
            >
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
            <span className="body-ui" style={{ fontSize: 10, color: "rgba(20,35,28,0.4)", letterSpacing: ".06em" }}>{t(language as UiLang, "LANG_LABEL")}</span>
          </div>

          <button onClick={analyze} disabled={loading || !token} style={{ marginTop: 18, background: token ? "var(--forest)" : "rgba(20,35,28,0.12)", color: token ? "#fff" : "rgba(20,35,28,0.4)", borderRadius: 999, padding: "14px 18px", fontSize: 13, letterSpacing: ".14em", opacity: loading ? 0.7 : 1 }}>
            {loading ? t(language as UiLang, "BTN_ANALYZING") : token ? t(language as UiLang, "BTN_ANALYZE") : t(language as UiLang, "BTN_LOGIN_FIRST")}
          </button>
          {banner && <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 12, background: isWarmBanner(banner) ? "rgba(227,183,91,0.12)" : "rgba(185,28,28,0.06)", border: isWarmBanner(banner) ? "1px solid rgba(227,183,91,0.22)" : "1px solid rgba(185,28,28,0.12)", fontSize: 12, color: isWarmBanner(banner) ? "#7a5a08" : "#7f1d1d" }}>{banner}</div>}
        </section>

        {loading && (
          <div className="no-print" style={{ marginTop: 24, display: "grid", gap: 14 }}>
            {[1, 2].map((i) => (
              <div key={i} style={{ height: 120, borderRadius: 16, background: "linear-gradient(90deg, #F3EFE2 25%, #EDE8D9 37%, #F3EFE2 63%)", backgroundSize: "400% 100%", animation: "shimmer 1.2s infinite" }} />
            ))}
          </div>
        )}

        {result && !loading && (
          <div className="gi-report" style={{ marginTop: 28, display: "grid", gap: 22 }}>
            <section style={{ background: "#fff", border: "1px solid var(--line-on-light)", borderRadius: 20, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span className="body-ui" style={{ fontSize: 10, letterSpacing: ".14em", color: "var(--forest)", border: "1px solid rgba(11,93,59,0.22)", padding: "4px 8px", borderRadius: 999, background: "rgba(11,93,59,0.06)" }}>{uiText(language as UiLang, "FEASIBILITY_SIGNALS")}</span>
                <span className="body-ui" style={{ marginLeft: "auto", fontSize: 11, color: "rgba(20,35,28,0.5)" }}>{formatINR(result.financial_plan.project_cost)} {t(language as UiLang, "PROJECT_WORD")} · {formatINR(result.financial_plan.max_loan)} {t(language as UiLang, "LOAN_WORD")}</span>
                <button type="button" onClick={() => window.print()} className="body-ui gi-print-btn" style={{ fontSize: 11, padding: "6px 14px", borderRadius: 999, border: "1px solid var(--forest)", color: "var(--forest)", background: "#fff", letterSpacing: ".08em", flexShrink: 0 }}>{t(language as UiLang, "BTN_PRINT")}</button>
              </div>

              {result.feasibility_report?.dataset_integration && (
                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: result.feasibility_report.dataset_integration.status === "actual_data" ? "rgba(11,93,59,0.06)" : "rgba(227,183,91,0.1)",
                  border: `1px solid ${result.feasibility_report.dataset_integration.status === "actual_data" ? "rgba(11,93,59,0.22)" : "rgba(227,183,91,0.28)"}`,
                  marginBottom: 14,
                  fontSize: 11,
                  lineHeight: 1.5,
                  color: result.feasibility_report.dataset_integration.status === "actual_data" ? "var(--forest)" : "#8a6a2f"
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
                    {result.feasibility_report.dataset_integration.status === "actual_data" ? `✓ ${uiText(language as UiLang, "VERIFIED_GOVERNMENT_DATA")}` : `ⓘ ${uiText(language as UiLang, "REGIONAL_FALLBACK")}`}
                  </span>
                  <div>
                    {result.feasibility_report.dataset_integration.status === "actual_data" ? (
                      <>
                        {uiText(language as UiLang, "GROUNDED_IN")} <strong>{result.feasibility_report.dataset_integration.demographics_source}</strong> ({result.feasibility_report.dataset_integration.village_matched} · {uiText(language as UiLang, "POPULATION")}: {result.feasibility_report.dataset_integration.population?.toLocaleString("en-IN")}, {result.feasibility_report.dataset_integration.households?.toLocaleString("en-IN")} {uiText(language as UiLang, "HOUSEHOLDS")}{result.feasibility_report.dataset_integration.dairy_cooperatives ? `, ${result.feasibility_report.dataset_integration.dairy_cooperatives} ${uiText(language as UiLang, "DAIRY_COOPS")}` : ""}{result.feasibility_report.dataset_integration.active_shgs ? `, ${result.feasibility_report.dataset_integration.active_shgs} ${uiText(language as UiLang, "ACTIVE_SHGS")}` : ""}) &amp; <strong>{result.feasibility_report.dataset_integration.benchmark_source}</strong>.
                      </>
                    ) : (
                      <>
                        {uiText(language as UiLang, "REGIONAL_FALLBACK_NOTE")}
                      </>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
                <div style={{ background: "var(--warm)", border: "1px solid var(--line-on-light)", borderRadius: 14, padding: 16 }}>
                  <p className="body-ui" style={{ fontSize: 10, letterSpacing: ".12em", color: "rgba(20,35,28,0.45)" }}>{t(language as UiLang, "R_MARKET")}</p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 6 }}>{result.feasibility_report.market_reach.estimated_consumers.toLocaleString("en-IN")} {t(language as UiLang, "CONSUMERS_WORD")}</p>
                  <p style={{ fontSize: 12, color: "rgba(20,35,28,0.55)", marginTop: 4 }}>{result.feasibility_report.competitor_map.count} {t(language as UiLang, "COMPETITORS_WORD")} · {result.feasibility_report.competitor_map.density_per_km2}/km² · {t(language as UiLang, "AVG_WORD")} {result.feasibility_report.market_reach.avg_distance_km} km</p>
                  <p style={{ fontSize: 11, color: "rgba(20,35,28,0.45)", marginTop: 8 }}>{t(language as UiLang, "CHANNELS_LABEL")} {result.feasibility_report.market_reach.channels.slice(0, 4).map((ch: string) => tdyn(language as UiLang, ch)).join(" · ")}</p>
                </div>

                <div style={{ background: "var(--warm)", border: "1px solid var(--line-on-light)", borderRadius: 14, padding: 16 }}>
                  <p className="body-ui" style={{ fontSize: 10, letterSpacing: ".12em", color: "rgba(20,35,28,0.45)" }}>{t(language as UiLang, "R_OPPORTUNITY")}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>{result.feasibility_report.opportunity_analysis.top_niche?.niche ? tdyn(language as UiLang, result.feasibility_report.opportunity_analysis.top_niche.niche) : ""}</p>
                  <p style={{ fontSize: 11, color: "rgba(20,35,28,0.55)", marginTop: 4 }}>{result.feasibility_report.opportunity_analysis.top_niche?.reason ? tdyn(language as UiLang, result.feasibility_report.opportunity_analysis.top_niche.reason) : ""}</p>
                  <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                    {result.feasibility_report.opportunity_analysis.niches.slice(0, 2).map((n: any) => (
                      <div key={n.niche} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                        <span style={{ width: 36, textAlign: "center", background: "var(--forest)", color: "#fff", borderRadius: 999, padding: "2px 6px", fontSize: 10 }}>{n.score}</span> {tdyn(language as UiLang, n.niche)}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: "var(--warm)", border: "1px solid var(--line-on-light)", borderRadius: 14, padding: 16 }}>
                  <p className="body-ui" style={{ fontSize: 10, letterSpacing: ".12em", color: "rgba(20,35,28,0.45)" }}>{t(language as UiLang, "R_VALUE")}</p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 6 }}>{result.feasibility_report.product_market_value.suggested_band}</p>
                  <p style={{ fontSize: 11, color: "rgba(20,35,28,0.55)", marginTop: 4 }}>{t(language as UiLang, "MEDIAN_WORD")} ₹{result.feasibility_report.product_market_value.pricing.median} · {tdyn(language as UiLang, result.feasibility_report.product_market_value.pricing.unit)}</p>
                  <p style={{ fontSize: 11, color: "rgba(20,35,28,0.45)", marginTop: 6 }}>{tdyn(language as UiLang, result.feasibility_report.product_market_value.regional_purchasing_power)}</p>
                </div>
              </div>

              {result.financial_plan.working_capital && result.financial_plan.scheme !== "INELIGIBLE" && (
                <div style={{ background: "var(--warm)", border: "1px solid var(--line-on-light)", borderRadius: 14, padding: 16, marginTop: 14 }}>
                  <p className="body-ui" style={{ fontSize: 10, letterSpacing: ".12em", color: "rgba(20,35,28,0.45)" }}>{t(language as UiLang, "R_WORKING_CAP")}</p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 6 }}>{formatINR(result.financial_plan.working_capital.working_capital_3mo)}</p>
                  <p style={{ fontSize: 11, color: "rgba(20,35,28,0.55)", marginTop: 4 }}>{t(language as UiLang, "WC_3MO")}</p>
                  <div style={{ marginTop: 10, display: "grid", gap: 6, fontSize: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(20,35,28,0.55)" }}>{t(language as UiLang, "WC_MONTHLY_OPEX")}</span><span>{formatINR(result.financial_plan.working_capital.monthly_opex_estimate)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(20,35,28,0.55)" }}>{t(language as UiLang, "WC_CONTINGENCY")}</span><span>{formatINR(result.financial_plan.working_capital.contingency_10pct)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(20,35,28,0.55)" }}>{t(language as UiLang, "WC_FIRST_YEAR")}</span><span>{formatINR(result.financial_plan.working_capital.first_year_outlay)}</span></div>
                  </div>
                  <p style={{ fontSize: 10, color: "rgba(20,35,28,0.45)", marginTop: 8 }}>{result.financial_plan.working_capital.note ? tdyn(language as UiLang, result.financial_plan.working_capital.note) : t(language as UiLang, "WC_NOTE_DEFAULT")}</p>
                </div>
              )}

              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ background: "#fff", border: "1px solid var(--line-on-light)", borderRadius: 14, padding: 16 }}>
                  <p className="body-ui" style={{ fontSize: 10, letterSpacing: ".12em" }}>{t(language as UiLang, "R_SWOT")}</p>
                  <div style={{ display: "grid", gap: 8, marginTop: 8, fontSize: 11, lineHeight: 1.5 }}>
                    <div><strong style={{ color: "var(--forest)" }}>S:</strong> {result.feasibility_report.swot.strengths.slice(0, 2).map((s: string) => tdyn(language as UiLang, s)).join(" · ")}</div>
                    <div><strong style={{ color: "#8a6a2f" }}>W:</strong> {result.feasibility_report.swot.weaknesses.map((s: string) => tdyn(language as UiLang, s)).join(" · ")}</div>
                    <div><strong>O:</strong> {result.feasibility_report.swot.opportunities.slice(0, 2).map((s: string) => tdyn(language as UiLang, s)).join(" · ")}</div>
                    <div><strong style={{ color: "#991b1b" }}>T:</strong> {result.feasibility_report.threats.slice(0, 2).map((s: string) => tdyn(language as UiLang, s)).join(" · ")}</div>
                  </div>
                </div>
                <div style={{ background: "var(--ink)", color: "var(--text-light)", borderRadius: 14, padding: 16 }}>
                  <p className="body-ui" style={{ fontSize: 10, letterSpacing: ".12em", color: "var(--gold-bright)" }}>{t(language as UiLang, "VIABILITY_SCORE")}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 8 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 36 }}>{result.feasibility_report.viability.score}<span style={{ fontSize: 16, opacity: 0.6 }}>/100</span></span>
                    <span className="body-ui" style={{ fontSize: 11, letterSpacing: ".12em", background: "rgba(227,183,91,0.14)", padding: "4px 8px", borderRadius: 999, color: "var(--gold-bright)" }}>{tdyn(language as UiLang, result.feasibility_report.viability.grade)}</span>
                  </div>
                  <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
                    {result.feasibility_report.viability.factors.map((f: any) => (
                      <div key={f.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, opacity: f.label === "RISK EXPOSURE" ? 0.6 : 1 }}>
                        <span className="body-ui" style={{ fontSize: 9, letterSpacing: ".06em" }}>{DATA[language as UiLang]?.[f.label] ?? f.label}</span><span className="mono-num">{f.v}</span>
                      </div>
                    ))}
                  </div>
                  <p className="body-ui" style={{ fontSize: 9, color: "rgba(237,234,223,0.45)", marginTop: 10, letterSpacing: ".04em", textTransform: "none" }}>demand 0.30 · supply 0.20 · pricing 0.15 · competition 0.15 · finance 0.10 · risk 0.10</p>
                </div>
              </div>

              <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span className="body-ui" style={{ fontSize: 10, color: "rgba(20,35,28,0.45)", background: "var(--warm)", border: "1px solid var(--line-on-light)", padding: "6px 10px", borderRadius: 999 }}>{t(language as UiLang, "PILL_COMP_MAP")} {tdyn(language as UiLang, result.feasibility_report.competitor_map.note)}</span>
                <span className="body-ui" style={{ fontSize: 10, color: "rgba(20,35,28,0.45)", background: "var(--warm)", border: "1px solid var(--line-on-light)", padding: "6px 10px", borderRadius: 999 }}>{t(language as UiLang, "PILL_THREATS")} {result.feasibility_report.threats.map((x: string) => tdyn(language as UiLang, x)).join(" · ")}</span>
                {result.feasibility_report.dataset_integration?.dairy_cooperatives && (
                  <span className="body-ui" style={{ fontSize: 10, color: "var(--forest)", background: "rgba(11,93,59,0.06)", border: "1px solid rgba(11,93,59,0.2)", padding: "6px 10px", borderRadius: 999 }}>{result.feasibility_report.dataset_integration.dairy_cooperatives} {uiText(language as UiLang, "DAIRY_COOPS")}</span>
                )}
                {result.feasibility_report.dataset_integration?.active_shgs && (
                  <span className="body-ui" style={{ fontSize: 10, color: "var(--forest)", background: "rgba(11,93,59,0.06)", border: "1px solid rgba(11,93,59,0.2)", padding: "6px 10px", borderRadius: 999 }}>{result.feasibility_report.dataset_integration.active_shgs} {uiText(language as UiLang, "ACTIVE_SHGS")}</span>
                )}
                {result.feasibility_report.dataset_integration?.power_supply_hours && (
                  <span className="body-ui" style={{ fontSize: 10, color: "rgba(20,35,28,0.45)", background: "var(--warm)", border: "1px solid var(--line-on-light)", padding: "6px 10px", borderRadius: 999 }}>⚡ {result.feasibility_report.dataset_integration.power_supply_hours}h {uiText(language as UiLang, "POWER_GRID")}</span>
                )}
              </div>
            </section>

            <section style={{ background: "linear-gradient(180deg,#071A14,#0B241C)", color: "var(--text-light)", borderRadius: 20, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span className="body-ui" style={{ fontSize: 10, letterSpacing: ".14em", color: "var(--gold-bright)", border: "1px solid rgba(227,183,91,0.22)", padding: "4px 8px", borderRadius: 999, background: "rgba(227,183,91,0.08)" }}>{result.financial_plan.scheme} · {result.financial_plan.interest_rate}% · {t(language as UiLang, "SCHEME_YEARS").replace("{y}", String(Math.round(result.financial_plan.tenure_months / 12)))} · {t(language as UiLang, "SCHEME_MORA").replace("{m}", String(result.financial_plan.moratorium_months))}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(237,234,223,0.55)" }}>{formatINR(result.financial_plan.project_cost)} {t(language as UiLang, "PROJECT_WORD")} → {formatINR(result.financial_plan.max_loan)} {t(language as UiLang, "LOAN_WORD")} (90%)</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--line-on-dark)", borderRadius: 14, padding: 16, textAlign: "center" }}>
                  <p className="body-ui" style={{ fontSize: 10, color: "rgba(237,234,223,0.55)" }}>{t(language as UiLang, "EMI_MONTH")}</p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--gold-bright)", marginTop: 6 }}>{formatINR(result.financial_plan.emi_monthly)}</p>
                </div>
                <div style={{ background: "var(--gold)", color: "#071A14", borderRadius: 14, padding: 16, textAlign: "center" }}>
                  <p className="body-ui" style={{ fontSize: 10, color: "rgba(7,26,20,0.7)" }}>{t(language as UiLang, "EMI_QUARTER")}</p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 6 }}>{formatINR(result.financial_plan.emi_quarterly)}{t(language as UiLang, "QTR_SUFFIX")}</p>
                  <p className="body-ui" style={{ fontSize: 9, color: "rgba(7,26,20,0.55)", marginTop: 2 }}>{t(language as UiLang, "QTR_PER_PS")}</p>
                </div>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--line-on-dark)", borderRadius: 14, padding: 16, textAlign: "center" }}>
                  <p className="body-ui" style={{ fontSize: 10, color: "rgba(237,234,223,0.55)" }}>{t(language as UiLang, "TOTAL_PAYABLE")}</p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: 20, marginTop: 6 }}>{formatINR(result.financial_plan.total_payable)}</p>
                  <p style={{ fontSize: 10, color: "rgba(237,234,223,0.45)" }}>{t(language as UiLang, "INTEREST_WORD")} {formatINR(result.financial_plan.total_interest)}</p>
                </div>
              </div>

              <div style={{ marginTop: 16, background: "#fff", color: "var(--text-dark)", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(20,35,28,0.08)" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line-on-light)", display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="body-ui" style={{ fontSize: 10, letterSpacing: ".12em" }}>{t(language as UiLang, "QUARTERLY_SCHEDULE")}</span>
                  <span className="body-ui" style={{ marginLeft: "auto", fontSize: 10, background: "var(--warm)", border: "1px solid var(--line-on-light)", padding: "4px 8px", borderRadius: 999, color: "rgba(20,35,28,0.5)" }}>{t(language as UiLang, "SCHEDULE_PAUSE").replace("{n}", String(result.financial_plan.moratorium_months)).replace("{amt}", formatINR(result.financial_plan.emi_quarterly))}</span>
                </div>
                <div style={{ maxHeight: 220, overflow: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead style={{ position: "sticky", top: 0, background: "var(--warm)" }}>
                      <tr className="body-ui" style={{ fontSize: 10, textAlign: "left", color: "rgba(20,35,28,0.55)" }}>
                        <th style={{ padding: "8px 12px" }}>{t(language as UiLang, "TH_QTR")}</th><th>{t(language as UiLang, "TH_MONTHS")}</th><th style={{ textAlign: "right" }}>{t(language as UiLang, "TH_EMI")}</th><th style={{ textAlign: "right" }}>{t(language as UiLang, "TH_PRINCIPAL")}</th><th style={{ textAlign: "right" }}>{t(language as UiLang, "TH_INTEREST")}</th><th style={{ textAlign: "right", paddingRight: 12 }}>{t(language as UiLang, "TH_BALANCE")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.financial_plan.quarterly_schedule.map((q: any) => (
                        <tr key={q.quarter} style={{ background: q.moratorium ? "rgba(227,183,91,0.08)" : "#fff", borderTop: "1px solid var(--line-on-light)" }}>
                          <td style={{ padding: "8px 12px", fontWeight: 600 }}>{q.quarter}</td>
                          <td>{q.months} {q.moratorium && <span style={{ marginLeft: 6, fontSize: 10, background: "var(--gold)", color: "#071A14", padding: "2px 6px", borderRadius: 999 }}>{t(language as UiLang, "MORATORIUM")}</span>}</td>
                          <td style={{ textAlign: "right" }}>{formatINR(q.emi)}</td>
                          <td style={{ textAlign: "right" }}>{formatINR(q.principal)}</td>
                          <td style={{ textAlign: "right" }}>{formatINR(q.interest)}</td>
                          <td style={{ textAlign: "right", paddingRight: 12 }}>{formatINR(q.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="body-ui" style={{ fontSize: 9, color: "rgba(20,35,28,0.4)", padding: "8px 14px", borderTop: "1px solid var(--line-on-light)", letterSpacing: ".04em", textTransform: "none" }}>{t(language as UiLang, "EMI_FORMULA").replace("{loan}", formatINR(result.financial_plan.max_loan)).replace("{rate}", String(result.financial_plan.interest_rate)).replace("{mora}", String(result.financial_plan.moratorium_months)).replace("{emi}", formatINR(result.financial_plan.emi_monthly)).replace("{qtr}", formatINR(result.financial_plan.emi_quarterly)).replace("{n}", String(result.financial_plan.tenure_months))}</p>
              </div>
            </section>

            <section style={{ background: "#fff", border: "1px solid var(--line-on-light)", borderRadius: 20, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span className="body-ui" style={{ fontSize: 11, letterSpacing: ".12em" }}>{t(language as UiLang, "R_NARRATIVES")} — {narrativeLang.toUpperCase()}</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  {LANGUAGES.map(({ code, label }) => (
                    <button key={code} onClick={() => switchNarrative(code)} disabled={narrLoading} className="body-ui" style={{ fontSize: 11, padding: "6px 12px", borderRadius: 999, background: narrativeLang === code ? "var(--forest)" : "#fff", color: narrativeLang === code ? "#fff" : "var(--text-dark)", border: "1px solid var(--line-on-light)" }}>{label}</button>
                  ))}
                </div>
              </div>
              {narrLoading ? <p style={{ fontSize: 12, color: "rgba(20,35,28,0.5)" }}>{uiText(language as UiLang, "SYNTHESISING")}</p> : narrativeData ? (
                <div style={{ display: "grid", gap: 10, fontSize: 13, lineHeight: 1.6 }}>
                  <p><strong>{uiText(language as UiLang, "OPPORTUNITY")}</strong> {narrativeData.opportunity_insight || narrativeData.vernacular_summary}</p>
                  <p><strong>{uiText(language as UiLang, "SWOT_LABEL")}</strong> {typeof narrativeData.swot === "string" ? narrativeData.swot : JSON.stringify(narrativeData.swot)}</p>
                  <p style={{ color: "rgba(20,35,28,0.65)" }}><strong>{uiText(language as UiLang, "THREATS")}</strong> {narrativeData.threats_note} · <strong>{uiText(language as UiLang, "PRICING")}</strong> {narrativeData.pricing_note}</p>
                  <p style={{ background: "rgba(11,93,59,0.06)", border: "1px solid rgba(11,93,59,0.12)", padding: "10px 12px", borderRadius: 12, fontStyle: "italic" }}>{narrativeData.vernacular_summary}</p>
                  <span className="body-ui" style={{ fontSize: 10, color: "rgba(20,35,28,0.35)", letterSpacing: ".06em", textTransform: "none" }}>{uiText(language as UiLang, "MODEL_SOURCE")}: {narrativeData._model || narrativeData.model || "template"} · {narrativeData._source || "template"}</span>
                </div>
              ) : <p style={{ fontSize: 12, color: "rgba(20,35,28,0.5)" }}>{uiText(language as UiLang, "NO_NARRATIVE")}</p>}
            </section>

            <section className="no-print" style={{ background: "var(--forest)", color: "#fff", borderRadius: 20, padding: 22, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <p className="body-ui" style={{ fontSize: 10, letterSpacing: ".14em", color: "var(--gold-bright)" }}>{t(language as UiLang, "APPLY_TITLE")}</p>
                <p style={{ fontFamily: "var(--font-display)", fontSize: 20, marginTop: 6 }}>{t(language as UiLang, "APPLY_SUB")}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>{t(language as UiLang, "APPLY_STATUS")}</p>
              </div>
              <button onClick={apply} disabled={applyState === "submitting" || applyState === "done"} style={{ background: applyState === "done" ? "#fff" : "var(--gold)", color: "#071A14", borderRadius: 999, padding: "14px 22px", fontSize: 13, letterSpacing: ".1em", fontWeight: 700, opacity: applyState === "submitting" ? 0.7 : 1 }}>
                {applyState === "done" ? t(language as UiLang, "ST_SUBMITTED") : applyState === "submitting" ? t(language as UiLang, "ST_SUBMITTING") : `${t(language as UiLang, "BTN_SUBMIT")}${result.case_id}`}
              </button>
            </section>
            {applyMsg && <p className="no-print" style={{ fontSize: 12, padding: "10px 14px", borderRadius: 12, background: applyState === "done" ? "rgba(34,197,94,0.08)" : "rgba(185,28,28,0.06)", border: applyState === "done" ? "1px solid rgba(34,197,94,0.18)" : "1px solid rgba(185,28,28,0.12)", color: applyState === "done" ? "#166534" : "#7f1d1d" }}>{applyMsg}</p>}
          </div>
        )}

        {myCases.length > 0 && (
          <section className="no-print" style={{ background: "#fff", border: "1px solid var(--line-on-light)", borderRadius: 16, padding: 16, marginTop: 20 }}>
            <p className="body-ui" style={{ fontSize: 10, letterSpacing: ".12em", marginBottom: 10 }}>{t(language as UiLang, "R_CASES")}</p>
            <div style={{ display: "grid", gap: 8 }}>
              {myCases.slice(0, 5).map((c) => (
                <div key={c.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: "var(--warm)", border: "1px solid var(--line-on-light)", fontSize: 12 }}>
                    <span style={{ fontWeight: 700 }}>#{c.id}</span> <span>{c.village} · {categoryText(language as UiLang, c.business_category)}</span> <span style={{ marginLeft: "auto", background: c.status === "APPROVED" ? "var(--forest)" : c.status === "REJECTED" ? "#7f1d1d" : "#fff", color: c.status === "APPROVED" ? "#fff" : c.status === "REJECTED" ? "#fff" : "var(--text-dark)", padding: "4px 8px", borderRadius: 999, fontSize: 10, border: "1px solid var(--line-on-light)" }}>{statusText(language as UiLang, c.status)}</span>
                    <button
                      onClick={() => setOpenChatId((prev) => (prev === c.id ? null : c.id))}
                      style={{ background: openChatId === c.id ? "var(--forest)" : "#fff", color: openChatId === c.id ? "#fff" : "var(--ink)", border: "1px solid var(--line-on-light)", borderRadius: 999, padding: "6px 12px", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      {openChatId === c.id ? "✕" : t(language as UiLang, "CHAT_BTN")}
                    </button>
                  </div>
                  {openChatId === c.id && token && (
                    <div style={{ marginTop: 8, height: "56vh" }}>
                      <CaseChat caseId={c.id} token={token} detail={null} language={language} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {!result && !loading && (
          <div className="no-print" style={{ marginTop: 32, padding: 20, borderRadius: 16, background: "rgba(227,183,91,0.08)", border: "1px solid rgba(227,183,91,0.18)", fontSize: 12, lineHeight: 1.6, color: "#7a5a08" }}>
            {t(language as UiLang, "EMPTY_STATE")}
          </div>
        )}
      </main>
      <style>{`@keyframes shimmer{0%{background-position:-400% 0}100%{background-position:400% 0}}`}</style>
    </div>
  );
}
