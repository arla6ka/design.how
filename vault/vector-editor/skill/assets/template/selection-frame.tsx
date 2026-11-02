// Vector editor (https://design.how/vault/vector-editor), selection-frame.tsx.
// FIXED. Change the VARIABLE values in params instead (SHAPE, VIEW_BOX, SHAPE_W, PAD, FRAME, GROUND).
"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { FRAME_CSS } from "./styles";

export interface FrameStyle {
  accent: string;
  handleSize: number;
  handleFill: string;
  borderWidth: number;
  showHandles: boolean;
  showBadge: boolean;
  badgeBg: string;
  badgeText: string;
  animateKey?: string | number;
}

export const DEFAULT_FRAME: FrameStyle = {
  accent: "#0d99ff",
  handleSize: 8,
  handleFill: "#ffffff",
  borderWidth: 1,
  showHandles: true,
  showBadge: true,
  badgeBg: "#0d99ff",
  badgeText: "#ffffff",
};

export function SelectionFrame({
  children,
  style = DEFAULT_FRAME,
  width,
  height,
}: {
  children: ReactNode;
  style?: FrameStyle;
  width?: number;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [firstMount, setFirstMount] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setFirstMount(false), 900);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (width != null && height != null) {
      setSize({ w: width, h: height });
      return;
    }
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.round(r.width), h: Math.round(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height]);

  const w = width ?? size.w;
  const h = height ?? size.h;

  const s = style;
  const half = s.handleSize / 2;
  const handle = (pos: CSSProperties, intro: boolean, delay: number): CSSProperties => ({
    position: "absolute",
    zIndex: 10,
    width: s.handleSize,
    height: s.handleSize,
    backgroundColor: s.handleFill,
    border: `1px solid ${s.accent}`,
    borderRadius: 1,
    ...(intro ? { animation: `bbox-handle 0.25s ease-out both`, animationDelay: `${delay}s` } : {}),
    ...pos,
  });

  const intro = firstMount;

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <div
        style={{
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          border: `${s.borderWidth}px solid ${s.accent}`,
          transformOrigin: "top left",
          animation: intro ? `bbox-open 0.6s cubic-bezier(0.16, 1, 0.3, 1) both` : undefined,
        }}
      />

      {s.showHandles && (
        <>
          <span style={handle({ top: -half, left: -half }, intro, 0.18)} />
          <span style={handle({ top: -half, right: -half }, intro, 0.28)} />
          <span style={handle({ bottom: -half, right: -half }, intro, 0.38)} />
          <span style={handle({ bottom: -half, left: -half }, intro, 0.48)} />
        </>
      )}

      {s.showBadge && (
        <span
          style={{
            pointerEvents: "none",
            position: "absolute",
            left: "50%",
            zIndex: 10,
            whiteSpace: "nowrap",
            borderRadius: 4,
            padding: "2px 8px",
            fontSize: 11,
            fontVariantNumeric: "tabular-nums",
            fontFamily: "var(--visual-sans, system-ui, sans-serif)",
            bottom: -30,
            backgroundColor: s.badgeBg,
            color: s.badgeText,
            transform: "translateX(-50%)",
            ...(intro ? { animation: `bbox-badge 0.25s ease-out both`, animationDelay: "0.2s" } : {}),
          }}
        >
          {w} × {h}
        </span>
      )}

      <style href="vector-editor-frame" precedence="default">{FRAME_CSS}</style>
      {children}
    </div>
  );
}
