'use client';

import {useEffect, useState, type RefObject} from 'react';

export function useScrollTabStop(ref: RefObject<HTMLElement | null>, enabled = true): 0 | undefined {
  const [scrolls, setScrolls] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) { setScrolls(false); return; }
    const measure = () => setScrolls(el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
    const resize = new ResizeObserver(measure);
    const watch = () => {
      resize.disconnect();
      resize.observe(el);
      for (const child of el.children) resize.observe(child);
      measure();
    };
    const swap = new MutationObserver(watch);
    swap.observe(el, {childList: true});
    watch();
    return () => { resize.disconnect(); swap.disconnect(); };
  }, [ref, enabled]);
  return scrolls ? 0 : undefined;
}
