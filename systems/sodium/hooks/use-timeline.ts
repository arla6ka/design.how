'use client';

import {useEffect, useLayoutEffect, useRef, useState, type RefObject} from 'react';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export const motionDefaults = {'--dur-type': 18, '--dur-scramble': 400, '--dur-draw': 300} as const;
export type MotionToken = keyof typeof motionDefaults;

export function parseDuration(value: string): number | undefined {
  const m = value.trim().match(/^(-?\d*\.?\d+)(ms|s)$/);
  if (!m) return undefined;
  return Number(m[1]) * (m[2] === 's' ? 1000 : 1);
}

export function easeOut(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const [x1, y1, x2, y2] = [0.2, 0.8, 0.2, 1];
  const at = (t: number, a: number, b: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  let lo = 0, hi = 1, t = x;
  for (let i = 0; i < 24; i++) {
    t = (lo + hi) / 2;
    if (at(t, x1, x2) < x) lo = t; else hi = t;
  }
  return at(t, y1, y2);
}

export function useMotionToken(ref: RefObject<Element | null> | undefined, token: MotionToken): {ms: number; reduced: boolean} {
  const [state, setState] = useState<{ms: number; reduced: boolean}>({ms: motionDefaults[token], reduced: false});
  useIsoLayoutEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const read = () => {
      const el = ref?.current;
      const value = el ? parseDuration(getComputedStyle(el).getPropertyValue(token)) : undefined;
      const ms = value ?? motionDefaults[token];
      const reduced = media.matches || !!el?.closest('[data-force-reduced-motion]') || ms <= 0;
      setState(s => s.ms === ms && s.reduced === reduced ? s : {ms, reduced});
    };
    read();
    media.addEventListener('change', read);
    return () => media.removeEventListener('change', read);
  }, [ref, token]);
  return state;
}

export type TimelineOptions = {
  clock?: number;
  play?: boolean;
  restart?: unknown;
};

type Internal = TimelineOptions & {
  total: number;
  step: (ms: number) => number;
  reduced: boolean;
};

export function useTimeline({total, step, clock, play = true, restart, reduced}: Internal): number {
  const [state, setState] = useState<{key: unknown; ms: number}>({key: restart, ms: 0});
  const ms = Object.is(state.key, restart) ? state.ms : 0;
  const elapsed = useRef(ms);
  elapsed.current = ms;
  const stepRef = useRef(step);
  stepRef.current = step;
  const controlled = clock !== undefined;

  useEffect(() => {
    if (controlled || reduced || !play) return;
    if (elapsed.current >= total) return;
    let frame = 0;
    const base = performance.now() - elapsed.current;
    let last = stepRef.current(elapsed.current);
    const tick = (now: number) => {
      const t = Math.min(total, now - base);
      const s = stepRef.current(t);
      if (s !== last || t >= total) {
        last = s;
        setState({key: restart, ms: t});
      }
      if (t < total) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [controlled, reduced, play, total, restart]);

  if (controlled) return Math.max(0, clock);
  if (reduced) return Number.POSITIVE_INFINITY;
  return ms;
}
