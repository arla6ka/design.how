// Colour depth (https://design.how/vault/color-depth), depth-button.tsx.
// FIXED. Change the VARIABLE values in params instead (SHOWCASE, RECIPES, LABEL, GROUND, DESIGN_WIDTH).
'use client';

import {useEffect, useRef, type RefObject} from 'react';
import {prefersReducedMotion} from './runtime/use-pause';
import {LABEL} from './recipes';

const REACTIVE = new Set(['depth-metal', 'depth-foil']);
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

function usePointerLight(ref: RefObject<HTMLElement | null>, className: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !REACTIVE.has(className) || prefersReducedMotion()) return;
    let raf = 0;
    let px = 0.5;
    let py = 0.5;
    const write = () => {
      raf = 0;
      const s = el.style;
      s.setProperty('--pointer-x', `${(px * 100).toFixed(1)}%`);
      s.setProperty('--pointer-y', `${(py * 100).toFixed(1)}%`);
      s.setProperty('--glare-x', `${(px * 100).toFixed(1)}%`);
      s.setProperty('--glare-y', `${(py * 100).toFixed(1)}%`);
      s.setProperty('--shine-angle', `${(110 + (px - 0.5) * 50).toFixed(1)}deg`);
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(write); };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (r.width && r.height) {
        px = clamp((e.clientX - r.left) / r.width, 0, 1);
        py = clamp((e.clientY - r.top) / r.height, 0, 1);
      }
      schedule();
    };
    const onLeave = () => { px = py = 0.5; schedule(); };
    el.addEventListener('pointermove', onMove, {passive: true});
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref, className]);
}

export function DepthButton({className}: {className: string}) {
  const ref = useRef<HTMLButtonElement>(null);
  usePointerLight(ref, className);
  const foil = className === 'depth-foil';
  return <button ref={ref} type="button" className={`depth-btn ${className}`}>
    {foil && <>
      <span aria-hidden className="depth-foil-l depth-foil-base"/>
      <span aria-hidden className="depth-foil-l depth-foil-film"/>
      <span aria-hidden className="depth-foil-l depth-foil-pearl"/>
    </>}
    <span className="depth-label">{LABEL}</span>
    {foil && <>
      <span aria-hidden className="depth-foil-l depth-foil-shine"/>
      <span aria-hidden className="depth-foil-l depth-foil-glare"/>
    </>}
  </button>;
}
