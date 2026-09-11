"use client";

import { useEffect, useRef, useState } from "react";

import Markdown from "./Markdown";
import { t } from "@/lib/assistant-strings";
import type { UiLang } from "@/lib/assistant-strings";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export default function CaseChat({
  caseId,
  token,
  detail,
  language = "en",
}: {
  caseId: number;
  token: string | null;
  detail: any;
  language?: UiLang | string;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const [started, setStarted] = useState(false);
  const [streaming, setStreaming] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const lang = (["en", "hi", "te"].includes(language) ? language : "en") as UiLang;

  useEffect(() => {
    if (!caseId) return;
    setMessages([]);
    setStreaming("");
    setStarted(false);
    setOffline(false);
  }, [caseId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const send = async (text: string) => {
    const question = (text || input).trim();
    if (!question || busy) return;
    const userMsg: Msg = { role: "user", content: question };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setBusy(true);
    setStarted(true);
    setStreaming("");
    setOffline(false);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const history = next.slice(-8);
      const r = await fetch(`/api/chat/${caseId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: question, history, language: lang }),
        signal: controller.signal,
      });

      if (!r.body) throw new Error("no body");

      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";
      let gotText = false;
      let sawDone = false;
      let hitOffline = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        for (const evt of events) {
          for (const line of evt.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (data === "[DONE]") {
              sawDone = true;
              break;
            }
            let parsed: any;
            try {
              parsed = JSON.parse(data);
            } catch {
              continue;
            }
            if (parsed.error) {
              hitOffline = true;
              continue;
            }
            if (parsed.text) {
              gotText = true;
              full += parsed.text;
              setStreaming(full);
            }
          }
          if (sawDone) break;
        }
        if (sawDone) break;
      }

      if (hitOffline) setOffline(true);
      setBusy(false);
      setStreaming("");
      if (full) {
        setMessages((m) => [...m, { role: "assistant", content: full }]);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: t(lang, "CHAT_NO_RESPONSE"),
          },
        ]);
      }
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: t(lang, "CHAT_ERR"),
        },
      ]);
      setBusy(false);
      setStreaming("");
    } finally {
      abortRef.current = null;
    }
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--line-on-light)",
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: "56vh",
        boxShadow: "0 1px 3px rgba(7,26,20,0.05)",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--line-on-light)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: busy ? "var(--gold)" : "var(--forest)",
          }}
        />
        <div>
          <p className="body-ui" style={{ fontSize: 10, letterSpacing: ".12em" }}>
            {t(lang, "CHAT_ADVISOR")}
          </p>
          <p style={{ fontSize: 11, color: "rgba(20,35,28,0.55)", marginTop: 1 }}>
            {busy ? t(lang, "CHAT_STATUS_THINKING") : t(lang, "CHAT_STATUS_IDLE")}
          </p>
        </div>
      </div>

        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflow: "auto",
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            justifyContent: "flex-start",
            background: "var(--warm)",
          }}
        >
        {!started && (
          <div style={{ fontSize: 12, color: "rgba(20,35,28,0.6)", lineHeight: 1.6 }}>
            {t(lang, "CHAT_INTRO").replace("{id}", String(caseId))}
            <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
              {[1, 2, 3, 4].map((n) => {
                const s = t(lang, `CHAT_SUGGEST_${n}` as any);
                return (
                  <button
                    key={n}
                    onClick={() => send(s)}
                    style={{
                      textAlign: "left",
                      fontSize: 11,
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "1px solid var(--line-on-light)",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "95%",
              background: m.role === "user" ? "var(--forest)" : "#fff",
              color: m.role === "user" ? "#fff" : "var(--text-dark)",
              padding: m.role === "user" ? "8px 14px" : "2px 4px",
              borderRadius: m.role === "user" ? 14 : 8,
              fontSize: 12,
              lineHeight: 1.6,
              border:
                m.role === "user" ? "none" : "none",
            }}
          >
            {m.role === "user" ? (
              <span style={{ whiteSpace: "pre-wrap" }}>{m.content}</span>
            ) : (
              <Markdown>{m.content}</Markdown>
            )}
          </div>
        ))}

        {streaming && (
          <div
            style={{
              alignSelf: "flex-start",
              maxWidth: "95%",
              background: "#fff",
              color: "var(--text-dark)",
              padding: "2px 4px",
              borderRadius: 8,
              fontSize: 12,
              lineHeight: 1.6,
              border: "none",
            }}
          >
            <Markdown>{streaming}</Markdown>
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 12,
                marginLeft: 2,
                background: "var(--gold)",
                animation: "blink 1s steps(1) infinite",
              }}
            />
          </div>
        )}

        {offline && (
          <p style={{ fontSize: 10, color: "#a16207", marginTop: 2 }}>
            {t(lang, "CHAT_OFFLINE")}
          </p>
        )}
      </div>

      <div
        style={{
          padding: "10px 12px",
          borderTop: "1px solid var(--line-on-light)",
          display: "flex",
          gap: 8,
          background: "#fff",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder={
            busy
              ? t(lang, "CHAT_STATUS_THINKING")
              : t(lang, "CHAT_PLACEHOLDER").replace("{id}", String(caseId))
          }
          disabled={busy}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 999,
            border: "1px solid var(--line-on-light)",
            background: "var(--warm)",
            fontSize: 12,
            outline: "none",
          }}
        />
        <button
          onClick={() => send(input)}
          disabled={busy || !input.trim()}
          style={{
            background: "var(--ink)",
            color: "#fff",
            borderRadius: 999,
            padding: "10px 16px",
            fontSize: 12,
            letterSpacing: ".06em",
            opacity: busy || !input.trim() ? 0.5 : 1,
            cursor: busy || !input.trim() ? "default" : "pointer",
          }}
        >
          {t(lang, "CHAT_SEND")}
        </button>
      </div>
    </div>
  );
}
