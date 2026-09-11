"use client";

import { useEffect, useRef } from "react";
import { mulberry32 } from "../../lib/utils";
import { useMediaQuery } from "../../lib/hooks";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  gold: boolean;
}

/**
 * Living geographic-intelligence layer: survey grid, topographic contours,
 * coordinate ticks, drifting data points forming an economic network.
 * Responds subtly to pointer. Pauses off-screen; static under reduced motion.
 */
export function HeroMapBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = true;
    let lastPing = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rand = mulberry32(20240601);

    const staticLayer = document.createElement("canvas");
    const sctx = staticLayer.getContext("2d")!;

    let particles: Particle[] = [];
    type Ping = { x: number; y: number; r: number; a: number };
    let pings: Ping[] = [];

    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

    const buildStatic = () => {
      sctx.clearRect(0, 0, w * dpr, h * dpr);
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // survey grid — very faint
      const step = 72;
      sctx.strokeStyle = "rgba(11,93,59,0.03)";
      sctx.lineWidth = 1;
      sctx.beginPath();
      for (let gx = (w / 2) % step; gx < w; gx += step) {
        sctx.moveTo(gx, 0);
        sctx.lineTo(gx, h);
      }
      for (let gy = (h / 2) % step; gy < h; gy += step) {
        sctx.moveTo(0, gy);
        sctx.lineTo(w, gy);
      }
      sctx.stroke();

      // topographic contours
      for (let i = 0; i < 10; i++) {
        const yBase = ((i + 0.5) / 10) * h;
        const amp = 18 + i * 4;
        const f1 = 0.004 + rand() * 0.002;
        const f2 = 0.0016 + rand() * 0.001;
        const ph = rand() * Math.PI * 2;
        sctx.beginPath();
        for (let px = -10; px <= w + 10; px += 14) {
          const py =
            yBase +
            Math.sin(px * f1 + ph) * amp +
            Math.sin(px * f2 + ph * 2) * amp * 0.6;
          px === -10 ? sctx.moveTo(px, py) : sctx.lineTo(px, py);
        }
        sctx.strokeStyle = `rgba(11,93,59,${0.03 + (i % 3) * 0.01})`;
        sctx.lineWidth = 1;
        sctx.stroke();
      }

      // survey crosses + coordinate labels
      const r2 = mulberry32(99);
      sctx.font = "500 9px 'Instrument Sans Variable', sans-serif";
      const labels = ["17.41°N", "78.52°E", "16.98°N", "79.01°E", "17.66°N"];
      labels.forEach((t, i) => {
        const lx = w * (0.08 + 0.19 * i);
        const ly = h * (0.14 + ((i * 0.23) % 0.72));
        sctx.fillStyle = "rgba(20,35,28,0.14)";
        sctx.fillText(t, lx, ly);
      });
      for (let i = 0; i < 16; i++) {
        const cx = r2() * w;
        const cy = r2() * h;
        const s = 4 + r2() * 3;
        sctx.strokeStyle = "rgba(11,93,59,0.1)";
        sctx.beginPath();
        sctx.moveTo(cx - s, cy);
        sctx.lineTo(cx + s, cy);
        sctx.moveTo(cx, cy - s);
        sctx.lineTo(cx, cy + s);
        sctx.stroke();
      }
    };

    const initParticles = () => {
      particles = Array.from({ length: 36 }, () => ({
        x: rand() * w,
        y: rand() * h,
        vx: (rand() - 0.5) * 0.14,
        vy: (rand() - 0.5) * 0.1,
        r: 1.4 + rand() * 1.6,
        gold: rand() < 0.18,
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      staticLayer.width = w * dpr;
      staticLayer.height = h * dpr;
      buildStatic();
      initParticles();
    };

    const drawFrame = (t: number) => {
      ctx.clearRect(0, 0, w, h);

      // eased pointer parallax
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      const ox = (mouse.x - 0.5) * 22;
      const oy = (mouse.y - 0.5) * 14;

      ctx.save();
      ctx.translate(ox, oy);
      ctx.drawImage(staticLayer, -24, -24, w + 48, h + 48);

      // particles + network links
      for (const p of particles) {
        p.x += p.vx + (mouse.x - 0.5) * 0.05;
        p.y += p.vy;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 5800) {
            const alpha = (1 - Math.sqrt(d2) / 76) * 0.07;
            ctx.strokeStyle = `rgba(11,93,59,${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (const p of particles) {
        ctx.fillStyle = p.gold
          ? "rgba(200,145,45,0.65)"
          : "rgba(11,93,59,0.35)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // demand pings — slower, subtler
      if (t - lastPing > 3200 && particles.length) {
        lastPing = t;
        const src = particles[(Math.random() * particles.length) | 0];
        pings.push({ x: src.x, y: src.y, r: 2, a: 0.35 });
      }
      pings = pings.filter((p) => p.a > 0.02);
      for (const p of pings) {
        p.r += 0.45;
        p.a *= 0.978;
        ctx.strokeStyle = `rgba(200,145,45,${p.a})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    };

    const loop = (t: number) => {
      if (!running) return;
      drawFrame(t);
      raf = requestAnimationFrame(loop);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (reduced) return;
        if (entry.isIntersecting && !running) {
          running = true;
          raf = requestAnimationFrame(loop);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    const onMove = (e: PointerEvent) => {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = e.clientY / window.innerHeight;
    };
    if (!reduced) window.addEventListener("pointermove", onMove, { passive: true });

    if (reduced) {
      running = false;
      drawFrame(0); // single static frame
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
}
