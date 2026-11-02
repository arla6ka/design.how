// Datamosh (https://design.how/vault/datamosh), card.tsx.
// FIXED. Change the VARIABLE values in params instead (PALETTE, COLS, POWER, TILES, CYCLE, STRETCH, SPRING_K, COL_PHASE).
'use client';

import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {Datamosh} from './engine';
import {GROUND} from './params';

export default function DatamoshCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<Datamosh | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const raf = requestAnimationFrame(() => {
      const next = new Datamosh(element, 1 + Math.floor(Math.random() * 9999));
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
    });
    return () => {
      cancelAnimationFrame(raf);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label="A corrupted video decode: fixed columns of saturated colour, each falling on its own fast clock. Tiles snap open through the middle of the frame and squeeze shut at the top and bottom, staggered column by column so the motion sweeps from right to left."
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: GROUND}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%'}}/>
  </div>;
}
