'use client';

import {useEffect, useRef} from 'react';

function useOffscreen<E extends HTMLElement = HTMLElement>(active = true) {
  const ref = useRef<E>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !active || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) el.removeAttribute('data-offscreen');
      else el.setAttribute('data-offscreen', '');
    });
    io.observe(el);
    return () => { io.disconnect(); el.removeAttribute('data-offscreen'); };
  }, [active]);
  return ref;
}

export {useOffscreen};
