'use client';

import {useEffect, useState, type RefObject} from 'react';

export function useScrollTabStop(ref: RefObject<HTMLElement | null>, enabled = true): 0 | undefined {
  const [scrolls, setScrolls] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const measure = () => setScrolls(el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
    const resize = new ResizeObserver(measure);
    resize.observe(el);
    for (const child of el.children) resize.observe(child);
    measure();
    return () => resize.disconnect();
  }, [ref, enabled]);
  return enabled && scrolls ? 0 : undefined;
}

export function findAll(text: string, q: string): [number, number][] {
  if (!q) return [];
  const out: [number, number][] = [];
  const hay = text.toLowerCase();
  let at = hay.indexOf(q);
  while (at >= 0) { out.push([at, at + q.length]); at = hay.indexOf(q, at + q.length); }
  return out;
}
