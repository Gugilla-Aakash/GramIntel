"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { useIsTouch } from "../../lib/hooks";

type CursorMode = "default" | "button" | "node" | "view" | "text";

/**
 * Custom cursor: precise dot + trailing ring.
 * Elements opt in via data-cursor="button|node|view" and data-cursor-label="…".
 * Rendered only on fine pointers; never blocks interaction.
 */
export function Cursor() {
  const isTouch = useIsTouch();
  const [mode, setMode] = useState<CursorMode>("default");
  const [label, setLabel] = useState<string>("");
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 260, damping: 24, mass: 0.6 });
  const ry = useSpring(y, { stiffness: 260, damping: 24, mass: 0.6 });

  useEffect(() => {
    if (isTouch) return;
    document.documentElement.classList.add("has-cursor");
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };
    const over = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest?.("[data-cursor]") as HTMLElement | null;
      if (t) {
        setMode((t.dataset.cursor as CursorMode) || "default");
        setLabel(t.dataset.cursorLabel ?? "");
      } else {
        setMode("default");
        setLabel("");
      }
    };
    const leave = () => setVisible(false);
    const down = () => setPressed(true);
    const up = () => setPressed(false);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("mouseover", over);
    document.addEventListener("mouseleave", leave);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mouseleave", leave);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
    };
  }, [isTouch, x, y]);

  if (isTouch) return null;

  const size =
    mode === "button" ? 58 : mode === "view" ? 84 : mode === "node" ? 40 : 34;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transition: "opacity .3s",
      }}
    >
      {/* trailing ring / pill */}
      <motion.div
        style={{ position: "absolute", left: x, top: y, x: "-50%", y: "-50%" }}
      >
        <motion.div
          animate={{
            width: label && mode === "view" ? "auto" : size,
            height: mode === "view" && label ? 34 : size,
            borderRadius: mode === "view" && label ? 999 : 999,
            scale: pressed ? 0.82 : 1,
            borderColor:
              mode === "default"
                ? "rgba(20,35,28,.45)"
                : mode === "node"
                ? "var(--gold)"
                : "rgba(11,93,59,.75)",
            backgroundColor:
              mode === "view" && label ? "rgba(7,26,20,.85)" : "transparent",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          style={{
            translateX: "-50%",
            translateY: "-50%",
            border: "1px solid",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mixBlendMode: mode === "default" ? "exclusion" : "normal",
            backdropFilter: mode === "view" ? "blur(2px)" : undefined,
            padding: mode === "view" && label ? "0 14px" : 0,
            whiteSpace: "nowrap",
          }}
        >
          <AnimatePresence>
            {mode === "view" && label && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="body-ui"
                style={{ fontSize: 10, color: "#F3EFE2", letterSpacing: ".18em" }}
              >
                {label}
              </motion.span>
            )}
            {mode === "node" && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 99,
                  background: "var(--gold)",
                  display: "block",
                }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* precise dot */}
      <motion.div
        style={{
          position: "absolute",
          left: rx,
          top: ry,
          x: "-50%",
          y: "-50%",
          width: 5,
          height: 5,
          borderRadius: 99,
          background:
            mode === "default" ? "rgba(237,234,223,.9)" : "var(--gold-bright)",
          mixBlendMode: mode === "default" ? "exclusion" : "normal",
        }}
      />
    </div>
  );
}
