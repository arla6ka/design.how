// Ghosty reveal (https://design.how/vault/ghosty-reveal), ghost-reveal.tsx.
// FIXED. Change the VARIABLE values in params instead (IMAGES, SLOTS, MASK_SCALE, DURATION, HOLD, EASING, DIRECTION).
"use client";

import { prefersReducedMotion } from "./runtime/use-pause";
import { MASK, MASK_H } from "./mask";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

export type GhostDirection = "up" | "down" | "left" | "right";

export interface GhostRevealProps {
  children: ReactNode;
  maskSrc?: string;
  maskSrcH?: string;
  scale?: number;
  duration?: number;
  easing?: string;
  direction?: GhostDirection;
  play?: boolean;
  threshold?: number;
  onHidden?: () => void;
  className?: string;
  style?: CSSProperties;
}

function axisFor(
  dir: GhostDirection,
  maskSrc: string,
  maskSrcH: string,
  scale: number,
) {
  const pct = `${scale}%`;
  switch (dir) {
    case "up":
      return { image: `url("${maskSrc}")`, size: `100% ${pct}`, from: "0% 0%", to: "0% 100%" };
    case "down":
      return { image: `url("${maskSrc}")`, size: `100% ${pct}`, from: "0% 100%", to: "0% 0%" };
    case "left":
      return { image: `url("${maskSrcH}")`, size: `${pct} 100%`, from: "0% 0%", to: "100% 0%" };
    case "right":
      return { image: `url("${maskSrcH}")`, size: `${pct} 100%`, from: "100% 0%", to: "0% 0%" };
  }
}

export function GhostReveal({
  children,
  maskSrc = MASK,
  maskSrcH = MASK_H,
  scale = 500,
  duration = 1000,
  easing = "cubic-bezier(0.16, 1, 0.3, 1)",
  direction = "up",
  play,
  threshold = 0.2,
  onHidden,
  className = "",
  style,
}: GhostRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const controlled = play !== undefined;
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (controlled) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [controlled, threshold]);

  const open = controlled ? play! : shown;
  const { image, size, from, to } = axisFor(
    direction,
    maskSrc,
    maskSrcH,
    scale,
  );

  const openRef = useRef(open);
  openRef.current = open;
  const onHiddenRef = useRef(onHidden);
  onHiddenRef.current = onHidden;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handle = (e: TransitionEvent) => {
      if (e.target !== el) return;
      if (e.propertyName !== "mask-position" && e.propertyName !== "-webkit-mask-position")
        return;
      if (!openRef.current) onHiddenRef.current?.();
    };
    el.addEventListener("transitionend", handle);
    return () => el.removeEventListener("transitionend", handle);
  }, []);

  const reduce = prefersReducedMotion();

  const maskStyle: CSSProperties = reduce
    ? { opacity: open ? 1 : 0, transition: `opacity 0.3s ${easing}` }
    : {
        WebkitMaskImage: image,
        maskImage: image,
        WebkitMaskSize: size,
        maskSize: size,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: open ? to : from,
        maskPosition: open ? to : from,
        transition: `-webkit-mask-position ${duration}ms ${easing}, mask-position ${duration}ms ${easing}`,
      };

  return (
    <div ref={ref} className={className} style={{ ...maskStyle, ...style }}>
      {children}
    </div>
  );
}
