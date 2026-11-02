// Flood type (https://design.how/vault/flood-type), card.tsx.
// FIXED. Change the VARIABLE values in params instead (PRESETS, PEAK_SCALE, SPIN_MAX, SPIN_TAIL, HOLD_TICKS, PULL, FONT_VAR).
'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {FloodType} from './engine';
import {FONT_VAR, FONT_WEIGHT, PRESETS} from './params';

export default function FloodTypeCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<FloodType | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      const next = new FloodType(element);
      engine.current = next;
      if (!next.ok) return;
      const probe = document.createElement('span');
      probe.style.cssText = `position:absolute;visibility:hidden;font-family:var(${FONT_VAR})`;
      probe.textContent = 'Ag';
      document.body.appendChild(probe);
      const family = getComputedStyle(probe).fontFamily || 'sans-serif';
      probe.remove();
      const first = family.split(',')[0].replace(/["']/g, '').trim();
      next.setFont(family);
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
      document.fonts?.load(`${FONT_WEIGHT} 1em "${first}"`).then(() => {
        if (cancelled) return;
        engine.current?.setFont(family);
        if (prefersReducedMotion()) engine.current?.renderStill();
      }, () => {});
    });

    const onMove = (event: PointerEvent) => {
      const r = element.getBoundingClientRect();
      if (r.width && r.height) engine.current?.setPointer(((event.clientX - r.left) / r.width) * 2 - 1, ((event.clientY - r.top) / r.height) * 2 - 1);
    };
    const onLeave = () => engine.current?.clearPointer();
    element.addEventListener('pointermove', onMove);
    for (const type of ['pointerleave', 'pointercancel', 'pointerup'] as const) element.addEventListener(type, onLeave);

    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => engine.current?.resize(), 120); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      element.removeEventListener('pointermove', onMove);
      for (const type of ['pointerleave', 'pointercancel', 'pointerup'] as const) element.removeEventListener(type, onLeave);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label="A two-line word in a light grotesque falls into place and holds, then rushes toward you until it overruns the frame with each letter turned at its own angle, holds, and drops away out of the bottom before the next word arrives in its own pair of colours."
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: PRESETS[0].bg}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%'}}/>
  </div>;
}
