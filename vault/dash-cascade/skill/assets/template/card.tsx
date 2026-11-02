// Dash cascade (https://design.how/vault/dash-cascade), card.tsx.
// FIXED. Change the VARIABLE values in params instead (WORDS, INK, BG, HUE_SPREAD_DEG, HUE_DRIFT_S, FPS).
'use client';

import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {DashCascade} from './engine';
import {BG} from './params';

export default function DashCascadeCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<DashCascade | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const raf = requestAnimationFrame(() => {
      const next = new DashCascade(element);
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
    });

    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => engine.current?.resize(), 120); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label="Three-letter words built from fat scanline dashes in shifting yellows on white, LOL, ART, TRY and TOY, each unfurling out of a dotted vertical line letter by letter, the first letter wiping top to bottom, the last bottom to top, the middle pinched between them. The word rests at full width, folds back into the line, and the next one unfurls in its place."
    onPointerEnter={() => engine.current?.setHover(true)}
    onPointerLeave={() => engine.current?.setHover(false)}
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: BG}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%'}}/>
  </div>;
}
