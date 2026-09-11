import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--warm)", color: "var(--text-dark)", display: "grid", placeItems: "center", padding: "32px 16px" }}>
      <div style={{ maxWidth: 560, width: "100%", background: "#fff", border: "1px solid var(--line-on-light)", borderRadius: 20, padding: 32, textAlign: "center", boxShadow: "0 12px 40px rgba(20,35,28,0.08)" }}>
        <p className="eyebrow" style={{ color: "var(--forest)" }}>404 — Not found</p>
        <h1 className="display-m" style={{ fontSize: 32, marginTop: 10 }}>This page doesn’t exist.</h1>
        <p style={{ fontSize: 13, color: "rgba(20,35,28,0.55)", marginTop: 12, lineHeight: 1.6 }}>
          The link you followed may be broken or the page was moved. Try the assistant, officer portal, or back to the story.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 20 }}>
          <Link href="/" style={{ background: "var(--forest)", color: "#fff", borderRadius: 999, padding: "10px 18px", fontSize: 12, letterSpacing: ".08em" }}>Go home</Link>
          <Link href="/assistant" style={{ background: "#fff", color: "var(--text-dark)", border: "1px solid var(--line-on-light)", borderRadius: 999, padding: "10px 18px", fontSize: 12 }}>Assistant</Link>
          <Link href="/map" style={{ background: "#fff", color: "var(--text-dark)", border: "1px solid var(--line-on-light)", borderRadius: 999, padding: "10px 18px", fontSize: 12 }}>Map</Link>
          <Link href="/portal" style={{ background: "#fff", color: "var(--text-dark)", border: "1px solid var(--line-on-light)", borderRadius: 999, padding: "10px 18px", fontSize: 12 }}>Portal</Link>
          <a href="/api/backend/docs" target="_blank" rel="noopener" style={{ fontSize: 11, color: "rgba(20,35,28,0.45)", border: "1px dashed var(--line-on-light)", borderRadius: 999, padding: "8px 14px" }}>API docs</a>
        </div>
        <p className="body-ui" style={{ fontSize: 10, color: "rgba(20,35,28,0.35)", marginTop: 16, letterSpacing: ".06em", textTransform: "none" }}>If you typed /docs, use /api/backend/docs — or sign in as officer to unlock docs.</p>
      </div>
    </div>
  );
}
