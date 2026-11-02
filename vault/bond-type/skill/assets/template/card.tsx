// Bond type (https://design.how/vault/bond-type), card.tsx.
// FIXED. Change the VARIABLE values in params instead (LINES, GREEN, WHITE, FPS, SCATTERS_MIN, SCATTERS_MAX, BOND_WEIGHT_CELLS, FONT_VAR).
'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {BondType} from './engine';
import {FONT_VAR, FONT_WEIGHT, GREEN} from './params';

export default function BondTypeCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<BondType | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      const probe = document.createElement('span');
      probe.style.cssText = `position:absolute;visibility:hidden;font-family:var(${FONT_VAR})`;
      probe.textContent = 'Ag';
      document.body.appendChild(probe);
      const family = getComputedStyle(probe).fontFamily || 'sans-serif';
      probe.remove();

      const next = new BondType(element, family);
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
      const first = family.split(',')[0].replace(/["']/g, '').trim();
      document.fonts?.load(`${FONT_WEIGHT} 1em "${first}"`).then(() => { if (!cancelled) engine.current?.setFont(family); }, () => {});
    });

    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => engine.current?.resize(), 120); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
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
    aria-label="The words Atoms and Bonds in a white pixel typeface on bright red. The letters drift apart into a molecule diagram, fine stair-stepped runs of square pixels bonding each letter to the next within its word. The chain re-scatters through a few different shapes, then the letters glide back into the plain typeset words and it starts again with a new sequence."
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: GREEN}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%'}}/>
  </div>;
}
