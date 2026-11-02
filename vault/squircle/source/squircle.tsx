"use client";

import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { squirclePath, roundRectPath } from "./superellipse";

export interface SquircleProps {
  radius: number;
  smoothing: number;
  exponent?: number;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  fill?: string;
  stroke?: string;
  strokeGradient?: string[];
  strokeWidth?: number;
  compare?: boolean;
  contentStyle?: CSSProperties;
}

export function Squircle({
  radius,
  smoothing,
  exponent,
  children,
  className = "",
  style,
  fill,
  stroke,
  strokeGradient,
  strokeWidth = 1,
  compare = false,
  contentStyle,
}: SquircleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/:/g, "");
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      setSize((p) => (p.w === w && p.h === h ? p : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w, h } = size;
  const body = w && h
    ? compare
      ? roundRectPath(w, h, radius)
      : squirclePath({ width: w, height: h, radius, smoothing, exponent })
    : "";
  const isCssGradient = !!fill && /gradient\(/.test(fill);

  return (
    <div ref={ref} className={className} style={{ position: "relative", ...style }}>
      {isCssGradient && w > 0 && h > 0 && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: fill,
            clipPath: `path("${body}")`,
            WebkitClipPath: `path("${body}")`,
            zIndex: 0,
          }}
        />
      )}
      {w > 0 && h > 0 && (
        <svg
          aria-hidden
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "block", zIndex: 0 }}
        >
          {fill && !isCssGradient && <path d={body} fill={fill} />}
        </svg>
      )}
      {children != null && (
        <div
          style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, ...contentStyle }}
        >
          {children}
        </div>
      )}
      {(stroke || strokeGradient) && w > 0 && h > 0 && (
        <svg
          aria-hidden
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "block", zIndex: 3 }}
        >
          <clipPath id={`sq-clip-${uid}`}>
            <path d={body} />
          </clipPath>
          {strokeGradient && (
            <linearGradient id={`sq-stroke-${uid}`} x1="0" y1="0" x2="0" y2="1">
              {strokeGradient.map((c, i) => (
                <stop key={i} offset={i / (strokeGradient.length - 1)} stopColor={c} />
              ))}
            </linearGradient>
          )}
          <path
            d={body}
            fill="none"
            stroke={strokeGradient ? `url(#sq-stroke-${uid})` : stroke}
            strokeWidth={strokeWidth * 2}
            clipPath={`url(#sq-clip-${uid})`}
          />
        </svg>
      )}
    </div>
  );
}
