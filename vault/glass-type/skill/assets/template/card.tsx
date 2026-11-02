// Glass type (https://design.how/vault/glass-type), card.tsx.
// FIXED. Change the VARIABLE values in params instead (A_TEXT, B_WORDS, C_WORDS, LENS, DISPERSE, SCENE_SECONDS, POINTER_PULL, INK, PAPER, FONT_VAR, FONT_WEIGHT).
'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {GlassType} from './engine';
import {FONT_VAR, FONT_WEIGHT, PAPER} from './params';

export default function GlassTypeCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<GlassType | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      const next = new GlassType(element);
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();

      const probe = document.createElement('span');
      probe.style.cssText = `position:absolute;visibility:hidden;font-family:var(${FONT_VAR})`;
      probe.textContent = 'Ag';
      document.body.appendChild(probe);
      const family = getComputedStyle(probe).fontFamily.split(',')[0].replace(/["']/g, '').trim();
      probe.remove();
      if (family) document.fonts?.load?.(`${FONT_WEIGHT} 1em "${family}"`).then(() => { if (!cancelled) engine.current?.setFont(`"${family}"`); }, () => {});
    });

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const r = element.getBoundingClientRect();
      if (r.width && r.height) engine.current?.setPointer({x: (event.clientX - r.left) / r.width, y: (event.clientY - r.top) / r.height});
    };
    const onLeave = () => engine.current?.setPointer(null);
    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);

    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => engine.current?.resize(), 120); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label="Black serif type on white, warped through a glass lens that fringes colour at its rim: a line rises and unrolls to readable, a hand-drawn glass ball swaps two words inside its boiling outline, and single words drift through a magnifying wave. The three scenes take turns, and hovering carries the lens with the pointer."
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: PAPER}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%'}}/>
  </div>;
}
