"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMediaQuery } from "../../lib/hooks";

gsap.registerPlugin(ScrollTrigger);

const LenisCtx = createContext<Lenis | null>(null);
export const useLenis = () => useContext(LenisCtx);

/** Buttery inertial scrolling; disabled for touch + reduced-motion users.
 *  Syncs with GSAP ScrollTrigger so pinned/ scrubbed sections stay accurate. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isTouch = useMediaQuery("(pointer: coarse)");
  const ref = useRef<Lenis | null>(null);

  useEffect(() => {
    if (reduced || isTouch) return;
    const l = new Lenis({
      duration: 0.85,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });
    ref.current = l;
    setLenis(l);

    // keep ScrollTrigger in sync with Lenis smooth scroll
    l.on("scroll", ScrollTrigger.update);

    // drive Lenis via gsap ticker — more accurate than manual rAF
    const tick = (time: number) => l.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // refresh ScrollTriggers after Lenis is ready
    ScrollTrigger.refresh();

    return () => {
      l.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(tick);
      l.destroy();
      ref.current = null;
      setLenis(null);
    };
  }, [reduced, isTouch]);

  return <LenisCtx.Provider value={lenis}>{children}</LenisCtx.Provider>;
}

export function scrollToId(lenis: Lenis | null, id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const navH = (() => {
    try {
      const raw = getComputedStyle(document.documentElement).getPropertyValue("--nav-h").trim();
      const n = parseInt(raw, 10);
      return Number.isFinite(n) ? n : 76;
    } catch {
      return 76;
    }
  })();
  const offset = -(navH + 12);
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.6 });
  else {
    const top = el.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top, behavior: "smooth" });
  }
}
