// Reality split (https://design.how/vault/reality-split), card.tsx.
// FIXED. Change the VARIABLE values in params instead (VARIANTS, PALETTES, FONT_FAMILY, SCATTER_SPREAD, TRAIN_DWELL_MIN, SPRING_AMP, SPRING_FREQ, SPRING_DAMP, CYCLE_VARIANTS).
'use client';

import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {RealitySplit} from './engine';
import {PALETTE, PALETTES, VARIANTS} from './params';

const first = VARIANTS[0]?.palette;
const FIELD = (typeof first === 'string' ? PALETTES[first] : first ?? PALETTE)?.bg ?? PALETTE.bg;

export default function RealitySplitCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<RealitySplit | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const raf = requestAnimationFrame(() => {
      const next = new RealitySplit(element);
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
    aria-label="A word sits selected in a design tool, each letter in its own box with corner handles. The letters split apart, scatter across the card, get inspected one at a time at huge scale, then collapse to a dot and snap back together as the whole word, which returns as a different word in a different colour world."
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: FIELD}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%'}}/>
  </div>;
}
