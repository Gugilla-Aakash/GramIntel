"use client";

import React from "react";
import { useUiLang } from "@/lib/landing-strings";
import { uiText } from "@/lib/ui-strings";

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorCopy />
      );
    }
    return this.props.children;
  }
}

function ErrorCopy() {
  const lang = useUiLang();
  return <div style={{padding:"40px 20px", textAlign:"center", background:"var(--warm)", border:"1px solid var(--line-on-light)", borderRadius:12, margin:"20px auto", maxWidth:720}}><div className="body-ui" style={{fontSize:10, color:"rgba(20,35,28,0.42)"}}>{uiText(lang, "SECTION_UNAVAILABLE")}</div><button onClick={() => window.location.reload()} style={{marginTop:12, fontSize:12, padding:"8px 14px", borderRadius:999, background:"var(--forest)", color:"#fff"}}>{uiText(lang, "RELOAD")}</button></div>;
}

export default ErrorBoundary;
