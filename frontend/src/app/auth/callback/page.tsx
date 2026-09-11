"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function CallbackInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [msg, setMsg] = useState("Finishing Google sign-in…");

  useEffect(() => {
    const token = params.get("token");
    const role = params.get("role");
    const email = params.get("email");
    const error = params.get("error");
    if (error) {
      setMsg(`OAuth error: ${error}`);
      return;
    }
    if (!token || !role) {
      setMsg("Missing token — please try again. Redirecting…");
      setTimeout(() => router.replace("/assistant"), 1500);
      return;
    }
    localStorage.setItem("gramintel_token", token);
    localStorage.setItem("gramintel_role", role);
    if (email) localStorage.setItem("gramintel_email", email);
    setMsg(`Signed in as ${email} (${role}) — redirecting…`);
    setTimeout(() => {
      if (role === "officer") router.replace("/portal");
      else router.replace("/assistant");
    }, 800);
  }, [params, router]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--warm)", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ background: "#fff", border: "1px solid var(--line-on-light)", borderRadius: 16, padding: 24, maxWidth: 520, textAlign: "center", boxShadow: "0 8px 32px rgba(20,35,28,0.06)" }}>
        <div style={{ width: 36, height: 36, borderRadius: 999, border: "2px solid var(--line-on-light)", borderTopColor: "var(--forest)", margin: "0 auto 14px", animation: "spin 0.8s linear infinite" }} />
        <p style={{ fontWeight: 600 }}>{msg}</p>
        <p style={{ fontSize: 11, color: "rgba(20,35,28,0.45)", marginTop: 8 }}>If you are not redirected, <a href="/assistant" style={{ color: "var(--forest)", textDecoration: "underline" }}>go to assistant</a> or <a href="/portal" style={{ color: "var(--forest)", textDecoration: "underline" }}>portal</a>.</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>Loading…</div>}>
      <CallbackInner />
    </Suspense>
  );
}
