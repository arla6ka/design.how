// Pixel cycle (https://design.how/vault/pixel-cycle), card.tsx.
// FIXED. Change the VARIABLE values in params instead (sprites(), PIXEL_START, PIXEL_MIN, PIXEL_STEPS, HOLD, IN_DURATION, OUT_DURATION, SWAP_SCALE_MIN, SWAP_SKEW).
'use client';

import {useEffect, useRef, type CSSProperties} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {PixelCycle} from './engine';
import {sprites} from './sprites';

const tint = (pct: number) => `color-mix(in srgb, #3b6fd6 ${pct}%, transparent)`;
const PAPER: CSSProperties = {
  backgroundColor: 'color-mix(in srgb, #4a8cff 0.8%, light-dark(#ffffff, #242423))',
  backgroundImage: [
    `linear-gradient(to right, ${tint(1.6)} 1px, transparent 1px)`,
    `linear-gradient(to bottom, ${tint(1.6)} 1px, transparent 1px)`,
    `linear-gradient(to right, ${tint(2.4)} 1px, transparent 1px)`,
    `linear-gradient(to bottom, ${tint(2.4)} 1px, transparent 1px)`,
    `conic-gradient(from 90deg at 50% 50%, ${tint(1.6)} 0 25%, transparent 0 50%, ${tint(1.6)} 0 75%, transparent 0)`,
  ].join(', '),
  backgroundSize: '8px 8px, 8px 8px, 32px 32px, 32px 32px, 16px 16px',
};

export default function PixelCycleCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<PixelCycle | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const raf = requestAnimationFrame(() => {
      const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      const next = new PixelCycle(element, sprites(), fine);
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
    aria-label="A small cartoon character on faint pixel paper, breaking into big square blocks, resolving sharp, then shrinking away as the next one grows in: a slime, a robot, a mushroom, a ghost and a cactus."
    className={className}
    style={{width: '100%', height: '100%', ...PAPER, userSelect: 'none'}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%'}}/>
  </div>;
}
