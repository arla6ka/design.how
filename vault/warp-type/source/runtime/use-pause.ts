// Warp type: a runtime helper the template imports. FIXED.
'use client';

import {useEffect, useRef, type RefObject} from 'react';

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function usePause(target: RefObject<Element | null>, onChange: (running: boolean) => void, {threshold = 0.2} = {}): RefObject<boolean> {
  const running = useRef(false);
  const callback = useRef(onChange);
  useEffect(() => { callback.current = onChange; });

  useEffect(() => {
    const element = target.current;
    if (!element) return;
    let onScreen = false;
    let hidden = document.hidden;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      const next = onScreen && !hidden && !motion.matches;
      if (next === running.current) return;
      running.current = next;
      callback.current(next);
    };
    const io = new IntersectionObserver(entries => { onScreen = entries.some(entry => entry.isIntersecting); sync(); }, {threshold});
    io.observe(element);
    const onVisibility = () => { hidden = document.hidden; sync(); };
    document.addEventListener('visibilitychange', onVisibility);
    motion.addEventListener('change', sync);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      motion.removeEventListener('change', sync);
      if (running.current) { running.current = false; callback.current(false); }
    };
  }, [target, threshold]);

  return running;
}
