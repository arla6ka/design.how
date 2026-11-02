// Pixel brushes (https://design.how/vault/pixel-brushes), card.tsx.
// FIXED. Change the VARIABLE values in params instead (SHOWN, BRUSHES, INKS, PAPER_BG, DRAW_MS, STAGGER_MS, TWEAKS).
'use client';

import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {PAPER_BG} from './params';
import {BrushSheet} from './engine';

export default function PixelBrushesCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<BrushSheet | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const raf = requestAnimationFrame(() => {
      const next = new BrushSheet(element);
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
    aria-label="Three pixel brush swatches on one sheet: the same spiral drawn three times in pink, blue and green, as a combed ribbon, a dense spray, and a loose drift of squares."
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: PAPER_BG}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%'}}/>
  </div>;
}
