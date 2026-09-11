"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HorizontalScrollStory } from "../scroll-story/ScrollStory";
import { MEDIA } from "@/lib/media";
import { VideoBackground } from "../media/VideoBackground";
import { useUiLang } from "@/lib/landing-strings";
import { uiText } from "@/lib/ui-strings";

const STAGES = [
  {
    n: "01",
    title: "Location",
    line: "One pin. Your village, placed on the economic map.",
    accent: "#7FA98F",
    wash: "radial-gradient(ellipse 70% 50% at 30% 40%, rgba(127,169,143,.06), transparent 70%)",
  },
  {
    n: "02",
    title: "Market",
    line: "Consumer density, spending power and footfall within reach.",
    accent: "#A9C3AE",
    wash: "radial-gradient(ellipse 60% 55% at 50% 45%, rgba(169,195,174,.05), transparent 65%)",
  },
  {
    n: "03",
    title: "Competition",
    line: "Every shop already serving your customers — counted.",
    accent: "#8A8578",
    wash: "radial-gradient(ellipse 65% 50% at 45% 50%, rgba(138,133,120,.05), transparent 70%)",
  },
  {
    n: "04",
    title: "Opportunity",
    line: "The gap between what people need and what exists.",
    accent: "#E3B75B",
    wash: "radial-gradient(ellipse 55% 50% at 60% 40%, rgba(227,183,91,.06), transparent 60%)",
  },
  {
    n: "05",
    title: "Finance",
    line: "Costs, loans, repayment — viability before commitment.",
    accent: "#C8912D",
    wash: "radial-gradient(ellipse 50% 45% at 55% 50%, rgba(200,145,45,.05), transparent 55%)",
  },
] as const;

const STAGE_KEYS = ["STAGE_LOCATION", "STAGE_MARKET", "STAGE_COMPETITION", "STAGE_OPPORTUNITY", "STAGE_FINANCE"] as const;
const STAGE_LINE_KEYS = ["STAGE_LOCATION_LINE", "STAGE_MARKET_LINE", "STAGE_COMPETITION_LINE", "STAGE_OPPORTUNITY_LINE", "STAGE_FINANCE_LINE"] as const;

/* ─────────── per-stage SVG micro-scenes ─────────── */
function StageArt({ i, visible }: { i: number; visible: boolean }) {
  const lang = useUiLang();
  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    show: (d: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: { duration: 1.2, delay: d, ease: [0.65, 0, 0.35, 1] as const },
    }),
  };
  const pop = {
    hidden: { scale: 0, opacity: 0 },
    show: (d: number) => ({
      scale: 1,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 240, damping: 16, delay: d },
    }),
  };
  const stroke = STAGES[i].accent;
  const common = { fill: "none", strokeWidth: 1.6, strokeLinecap: "round" as const, variants: draw } as const;

  return (
    <svg viewBox="0 0 380 260" style={{ width: "100%", height: "auto" }} aria-hidden>
      <motion.g initial="hidden" animate={visible ? "show" : "hidden"}>
        {i === 0 && (
          <>
            {[92, 66, 40].map((r, k) => (
              <motion.circle key={r} {...(common as any)} custom={k * 0.15} cx={190} cy={130} r={r} stroke={stroke} opacity={0.55 - k * 0.12} />
            ))}
            <motion.path d="M190 96 L204 130 L190 164 L176 130 Z" {...(common as any)} custom={0.5} stroke={stroke} />
            <motion.circle cx={190} cy={130} r={5} variants={pop} custom={0.9} fill="#E3B75B" />
            <motion.text x={208} y={134} fontSize={10} className="body-ui" fill="rgba(237,234,223,.7)" variants={pop} custom={1.1}>
              {uiText(lang, "F_VILLAGE")}
            </motion.text>
          </>
        )}
        {i === 1 && (
          <>
            {[38, 74, 110].map((r, k) => (
              <motion.path key={r} d={`M ${190 - r} 170 A ${r} ${r} 0 0 1 ${190 + r} 170`} {...(common as any)} custom={k * 0.2} stroke={stroke} />
            ))}
            {[[150, 150], [196, 128], [232, 152], [172, 112], [222, 118]].map(([x, y], k) => (
              <motion.circle key={k} cx={x} cy={y} r={3} variants={pop} custom={0.7 + k * 0.12} fill={stroke} />
            ))}
            <motion.text x={190} y={196} textAnchor="middle" fontSize={10} className="body-ui" fill="rgba(237,234,223,.7)" variants={pop} custom={1.2}>
              {uiText(lang, "R_MARKET")}
            </motion.text>
          </>
        )}
        {i === 2 && (
          <>
            {Array.from({ length: 16 }).map((_, k) => {
              const col = k % 4;
              const row = Math.floor(k / 4);
              const busy = [1, 2, 4, 6, 9, 11, 14].includes(k);
              return (
                <motion.rect key={k} x={110 + col * 44} y={62 + row * 44} width={26} height={26} rx={4}
                  variants={pop} custom={0.15 + k * 0.06} fill={busy ? stroke : "none"}
                  stroke={busy ? stroke : "rgba(237,234,223,.25)"} opacity={busy ? 0.75 : 1} />
              );
            })}
            <motion.text x={286} y={82} fontSize={10} className="body-ui" fill="rgba(237,234,223,.7)" variants={pop} custom={1.3}>
              7 {uiText(lang, "STAGE_COMPETITION").toUpperCase()}
            </motion.text>
          </>
        )}
        {i === 3 && (
          <>
            {Array.from({ length: 12 }).map((_, k) => (
              <motion.circle key={k} cx={70 + ((k * 53) % 250)} cy={60 + ((k * 37) % 140)} r={3}
                variants={pop} custom={0.1 + k * 0.05} fill="rgba(237,234,223,.35)" />
            ))}
            <motion.ellipse cx={230} cy={130} rx={64} ry={46} {...(common as any)} custom={0.6} stroke="#E3B75B" />
            <motion.ellipse cx={230} cy={130} rx={64} ry={46} fill="rgba(227,183,91,.13)" stroke="none" variants={pop} custom={0.85} />
            <motion.text x={230} y={206} textAnchor="middle" fontSize={10} className="body-ui" fill="#E3B75B" variants={pop} custom={1}>
              {uiText(lang, "STAGE_OPPORTUNITY").toUpperCase()}
            </motion.text>
          </>
        )}
        {i === 4 && (
          <>
            <motion.circle cx={90} cy={130} r={20} {...(common as any)} custom={0.1} stroke="#C8912D" />
            <motion.text x={90} y={135} textAnchor="middle" fontSize={15} fill="#C8912D" variants={pop} custom={0.3} fontWeight={600}>₹</motion.text>
            <motion.path d="M114 130 C 160 130, 168 84, 216 84 L268 84" {...(common as any)} custom={0.45} stroke="#C8912D" />
            <motion.path d="M114 130 C 160 130, 168 130, 216 130 L268 130" {...(common as any)} custom={0.6} stroke="#C8912D" />
            <motion.path d="M114 130 C 160 130, 168 176, 216 176 L268 176" {...(common as any)} custom={0.75} stroke="#C8912D" />
            {[84, 130, 176].map((y, k) => (
              <motion.rect key={y} x={272} y={y - 11} width={54 - k * 6} height={22} rx={3}
                variants={pop} custom={0.9 + k * 0.15} fill={stroke as string} opacity={0.8 - k * 0.18} />
            ))}
          </>
        )}
      </motion.g>
    </svg>
  );
}

function StagePanel({ i, active, shown }: { i: number; active: boolean; shown: boolean }) {
  const lang = useUiLang();
  const s = STAGES[i];
  return (
    <article
      className="stage-panel"
      style={{
        flexShrink: 0,
        width: "min(74vw, 760px)",
        display: "grid",
        gridTemplateColumns: "1.05fr .95fr",
        gap: "clamp(20px, 2.8vw, 48px)",
        alignItems: "center",
        opacity: active ? 1 : 0.55,
        filter: active ? "none" : "saturate(.85)",
        transition: "opacity .45s ease, filter .45s ease, transform .45s ease",
        transform: active ? "scale(1)" : "scale(.97)",
      }}
    >
      <div>
        <div aria-hidden style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(84px, 9vw, 148px)",
          lineHeight: 1,
          color: "transparent",
          WebkitTextStroke: `1.5px ${s.accent}52`,
          marginBottom: 8,
        }}>
          {s.n}
        </div>
        <h3 className="display-l" style={{ fontSize: "clamp(30px, 3.6vw, 54px)", color: "var(--text-light)" }}>
          {uiText(lang, STAGE_KEYS[i])}
        </h3>
        <p className="body-lg" style={{ marginTop: 16, maxWidth: 340, color: "var(--muted-on-dark)" }}>
          {uiText(lang, STAGE_LINE_KEYS[i])}
        </p>
        <div aria-hidden style={{
          width: 44, height: 2, marginTop: 22,
          background: s.accent,
          transformOrigin: "left",
          transform: active ? "scaleX(1)" : "scaleX(0)",
          transition: "transform .6s cubic-bezier(.16,1,.3,1)",
        }} />
      </div>
      <div style={{ border: "1px solid var(--line-on-dark)", padding: "clamp(14px,1.8vw,28px)", background: "rgba(255,255,255,.02)", borderRadius: 4 }}>
        <StageArt i={i} visible={shown} />
      </div>
    </article>
  );
}

export function HowItThinks() {
  const lang = useUiLang();
  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(false);
  const [seen, setSeen] = useState<Set<number>>(new Set());

  const activeIdx = Math.min(STAGES.length - 1, Math.max(0, Math.floor(progress * STAGES.length + 0.0001)));

  const markSeen = useCallback((idx: number) => {
    setSeen((prev) => {
      if (prev.has(idx)) return prev;
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
  }, []);

  useEffect(() => {
    if (started) markSeen(activeIdx);
  }, [activeIdx, started, markSeen]);

  const handleProgress = useCallback((p: number) => {
    setProgress(p);
    setStarted((prev) => (prev ? prev : true));
  }, []);

  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
      <div>
        <div className="eyebrow" style={{ color: "var(--gold)" }}>{uiText(lang, "HOW_THINKS")}</div>
        <p className="body-lg" style={{ color: "var(--muted-on-dark)", marginTop: 10, maxWidth: 440, fontSize: 16 }}>
          {uiText(lang, "FIVE_MOVES")}
        </p>
      </div>
      <div className="mono-num" style={{ fontSize: 13, color: "rgba(237,234,223,.5)", letterSpacing: ".2em", flexShrink: 0 }}>
        {STAGES[activeIdx].n} <span style={{ opacity: 0.4 }}>/ 05</span>
      </div>
    </div>
  );

  const rail = (
    <div>
      <div style={{ position: "relative", height: 2, background: "var(--line-on-dark)", overflow: "hidden", borderRadius: 99 }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: `${progress * 100}%`,
            width: 90,
            height: 6,
            marginTop: -2,
            borderRadius: 99,
            background: "var(--gold)",
            transform: "translateX(-50%)",
            transition: "left .12s linear",
            willChange: "left",
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, gap: 8, flexWrap: "wrap" }}>
        {STAGES.map((s, i) => (
          <span key={s.n} className="body-ui" style={{
            fontSize: 10, letterSpacing: ".22em",
            color: i === activeIdx ? "var(--gold-bright)" : "rgba(237,234,223,.35)",
            transition: "color .3s",
            whiteSpace: "nowrap",
          }}>
            {s.n} {uiText(lang, STAGE_KEYS[i]).toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );

  const viewportBg = (
    <>
      <div style={{ position: "absolute", inset: 0, opacity: 0.09, pointerEvents: "none" }}>
        <VideoBackground
          sources={[MEDIA.villageDawnCart.mp4, MEDIA.villageDawnCart.fallback]}
          opacity={1}
          filter="saturate(.45) brightness(.88)"
          overlay="linear-gradient(180deg, rgba(7,26,20,.55), rgba(7,26,20,.75))"
        />
      </div>
      {STAGES.map((s, i) => {
        const mid = (i + 0.5) / STAGES.length;
        const dist = Math.abs(progress - mid);
        const op = Math.max(0, 1 - dist / (1 / STAGES.length));
        return (
          <div key={s.n} aria-hidden style={{
            position: "absolute",
            inset: 0,
            background: s.wash,
            opacity: op * 0.7,
            pointerEvents: "none",
            transition: "opacity .12s",
          }} />
        );
      })}
    </>
  );

  return (
    <HorizontalScrollStory
      id="how"
      background="#071A14"
      viewportBg={viewportBg}
      onProgress={handleProgress}
      header={header}
      rail={rail}
    >
      {STAGES.map((_, i) => (
        <StagePanel key={STAGES[i].n} i={i} active={i === activeIdx} shown={seen.has(i)} />
      ))}
    </HorizontalScrollStory>
  );
}
