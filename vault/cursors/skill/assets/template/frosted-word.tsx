// Cursors (https://design.how/vault/cursors), frosted-word.tsx.
// FIXED. Change the VARIABLE values in params instead (CURSORS, WORD, GROUND, INK, WORD_FONT, FONT_VAR, DESIGN_WIDTH).
"use client";

import type { CSSProperties, ReactNode } from "react";

export function FrostedWord({
  children,
  ground,
  ink,
  style,
}: {
  children: ReactNode;
  ground: string;
  ink: string;
  style?: CSSProperties;
}) {
  return (
    <span style={{ position: "relative", display: "inline-block", color: ink, ...style }}>
      <span
        aria-hidden
        style={{
          pointerEvents: "none",
          position: "absolute",
          left: "50%",
          top: "50%",
          zIndex: -1,
          height: "2.03em",
          width: "8.4em",
          maxWidth: "130%",
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(ellipse 100% 100% at 50% 50%, ${ground} 0%, transparent 70%)`,
          filter: "blur(30px)",
        }}
      />
      <span
        style={{ position: "relative", display: "inline-block", transform: "translateX(-1px) translateY(-2px) rotate(-1deg)" }}
      >
        <span
          aria-hidden
          style={{ position: "absolute", inset: 0, opacity: 0.14, filter: "blur(9px)" }}
        >
          {children}
        </span>
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.16,
            transform: "translate(-1.5px, 3px)",
            filter: "blur(5px)",
            maskImage: "linear-gradient(186deg, transparent 20%, black 100%)",
            WebkitMaskImage: "linear-gradient(186deg, transparent 20%, black 100%)",
          }}
        >
          {children}
        </span>
        <span
          style={{
            position: "relative",
            zIndex: 10,
            maskImage:
              "linear-gradient(186deg, black 0%, black 40%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(186deg, black 0%, black 40%, transparent 100%)",
          }}
        >
          {children}
        </span>
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            filter: "blur(2px)",
            maskImage:
              "linear-gradient(186deg, transparent 0%, black 60%, black 100%)",
            WebkitMaskImage:
              "linear-gradient(186deg, transparent 0%, black 60%, black 100%)",
          }}
        >
          {children}
        </span>
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.28,
            transform: "translate(1.5px, 2px)",
            filter: "blur(3.5px)",
            maskImage: "linear-gradient(186deg, transparent 30%, black 100%)",
            WebkitMaskImage: "linear-gradient(186deg, transparent 30%, black 100%)",
          }}
        >
          {children}
        </span>
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.7,
            color: "rgba(255,255,255,0.9)",
            maskImage: "linear-gradient(180deg, black 0%, transparent 30%)",
            WebkitMaskImage: "linear-gradient(180deg, black 0%, transparent 30%)",
          }}
        >
          {children}
        </span>
        <span
          aria-hidden
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: "-4px -8px",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.14) 38%, rgba(255,255,255,0.08) 62%, rgba(255,255,255,0.24) 100%)",
            border: "1px solid rgba(0,0,0,0.06)",
            borderTopColor: "rgba(255,255,255,0.75)",
            borderRadius: "10px",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 1px rgba(0,0,0,0.05), inset 0 0 0 3px rgba(255,255,255,0.14), inset 0 0 0 4px rgba(0,0,0,0.045), inset 0 8px 16px rgba(255,255,255,0.18), 0 1px 3px rgba(0,0,0,0.07), 0 6px 16px rgba(0,0,0,0.07)",
          }}
        />
        <span
          aria-hidden
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: "-4px -8px",
            borderRadius: "10px",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.7), transparent 12%)",
            mixBlendMode: "overlay",
          }}
        />
      </span>
    </span>
  );
}
