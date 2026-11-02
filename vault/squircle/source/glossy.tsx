"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Squircle } from "./squircle";
import { shapePath } from "./superellipse";
import { TEXT, TRACKING } from "./params";

export interface Shape {
  radius: number;
  smoothing: number;
  exponent?: number;
  compare?: boolean;
}

export function GlossySquircle({
  w,
  h,
  radius,
  smoothing,
  exponent,
  compare,
  children,
  contentStyle,
  interactive = true,
}: Shape & {
  w?: number;
  h?: number;
  children?: ReactNode;
  contentStyle?: CSSProperties;
  interactive?: boolean;
}) {
  const auto = w === undefined || h === undefined;
  const measureRef = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState({ w: w ?? 0, h: h ?? 0 });
  useLayoutEffect(() => {
    if (!auto) return;
    const el = measureRef.current;
    if (!el) return;
    const m = () => setSize((p) =>
      p.w === el.offsetWidth && p.h === el.offsetHeight ? p : { w: el.offsetWidth, h: el.offsetHeight });
    m();
    const ro = new ResizeObserver(m);
    ro.observe(el);
    return () => ro.disconnect();
  }, [auto]);

  const cw = auto ? size.w : (w as number);
  const ch = auto ? size.h : (h as number);
  const clip = cw && ch ? `path("${shapePath({ width: cw, height: ch, radius, smoothing, exponent, plain: compare })}")` : "none";
  const layer = (style: CSSProperties) => (
    <span
      aria-hidden
      style={{ pointerEvents: "none", position: "absolute", inset: 0, clipPath: clip, WebkitClipPath: clip, ...style }}
    />
  );

  const HAIRLINE =
    "drop-shadow(0 0 0.5px rgba(0,0,0,0.18)) drop-shadow(0 0.5px 0.5px rgba(255,255,255,0.9))";
  const press = interactive ? "squircle-press" : "";

  const gloss = (
    <>
      {layer({ background: "radial-gradient(120% 130% at 50% 50%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.045) 100%)" })}
      {layer({ background: "radial-gradient(70% 120% at 50% 45%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 70%)" })}
      {layer({
        opacity: 0.05,
        mixBlendMode: "overlay",
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      })}
      {layer({
        opacity: 0.5,
        mixBlendMode: "overlay",
        backgroundImage:
          "repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0px, rgba(0,0,0,0.03) 1px, rgba(255,255,255,0.06) 2px)",
      })}
      {layer({
        mixBlendMode: "screen",
        background: "linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.28) 46%, rgba(255,255,255,0) 60%)",
      })}
      {layer({
        background: "linear-gradient(180deg, rgba(255,255,255,0) 34%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 66%)",
        opacity: 0.45,
      })}
      {layer({
        background: "linear-gradient(90deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 8%, rgba(255,255,255,0) 92%, rgba(255,255,255,0.5) 100%)",
        opacity: 0.5,
      })}
      {layer({ background: "radial-gradient(78% 82% at 50% -34%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.28) 42%, rgba(255,255,255,0) 72%)" })}
      {layer({ boxShadow: "inset 0 2px 0 -1px rgba(255,255,255,0.85)" })}
      {layer({ mixBlendMode: "screen", background: "radial-gradient(90% 60% at 50% 118%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 60%)" })}
      {layer({ mixBlendMode: "screen", boxShadow: "inset 0 -15px 2px -12px rgba(255,255,255,0.25)" })}
      {layer({ mixBlendMode: "color-burn", boxShadow: "inset 0 -6px 5px -2px #d2d2d2" })}
      {layer({ boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.06)" })}
      {layer({ mixBlendMode: "screen", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.28)" })}
      {layer({ boxShadow: "inset 0 0 6px 0 rgba(0,0,0,0.05)" })}
      {layer({
        mixBlendMode: "screen",
        background:
          "radial-gradient(6px 5px at 14% 14%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 100%), radial-gradient(6px 5px at 86% 14%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 100%)",
      })}
    </>
  );

  const squircleBg = (extraStyle: CSSProperties) => (
    <Squircle
      radius={radius}
      smoothing={smoothing}
      exponent={exponent}
      compare={compare}
      fill="linear-gradient(180deg, #ffffff 0%, #f4f4f5 52%, #ececed 100%)"
      strokeGradient={["#d3d6db", "#b4b7bd", "#7f8288"]}
      strokeWidth={1}
      style={extraStyle}
    >
      {gloss}
    </Squircle>
  );

  if (!auto) {
    return (
      <Squircle
        radius={radius}
        smoothing={smoothing}
        exponent={exponent}
        compare={compare}
        contentStyle={contentStyle}
        fill="linear-gradient(180deg, #ffffff 0%, #f4f4f5 52%, #ececed 100%)"
        strokeGradient={["#d3d6db", "#b4b7bd", "#7f8288"]}
        strokeWidth={1}
        className={press || undefined}
        style={{ width: w, height: h, filter: HAIRLINE }}
      >
        {gloss}
        {children}
      </Squircle>
    );
  }

  return (
    <span
      className={press || undefined}
      style={{ position: "relative", display: "inline-flex", filter: HAIRLINE }}
    >
      {cw > 0 && ch > 0 && squircleBg({ position: "absolute", inset: 0 })}
      <span ref={measureRef} style={{ position: "relative", zIndex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", ...contentStyle }}>
        {children}
      </span>
    </span>
  );
}

export function InkLabel({
  children,
  size = TEXT,
  tracking = TRACKING,
}: {
  children: ReactNode;
  size?: number;
  tracking?: number;
}) {
  const ls = `${tracking}px`;
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap" }}>
      <span
        aria-hidden
        style={{ pointerEvents: "none", position: "absolute", fontWeight: 500, color: "rgba(0,0,0,0.2)", filter: "blur(2px)", fontSize: size, letterSpacing: ls }}
      >
        {children}
      </span>
      <span
        style={{
          position: "relative",
          zIndex: 2,
          fontWeight: 500,
          fontSize: size,
          letterSpacing: ls,
          padding: "0 0.5px",
          backgroundImage: "linear-gradient(180deg, #14151a 0%, #33353b 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          filter:
            "drop-shadow(0 1px 1px rgba(255,255,255,0.8)) drop-shadow(0 -0.5px 0.3px rgba(255,255,255,0.5)) drop-shadow(0 -0.5px 0.5px rgba(0,0,0,0.12))",
        }}
      >
        {children}
      </span>
    </span>
  );
}

