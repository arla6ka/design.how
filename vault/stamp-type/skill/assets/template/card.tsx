// Stamp type (https://design.how/vault/stamp-type), card.tsx.
// FIXED. Change the VARIABLE values in params instead (WORLDS, PARK_FRAMES, STAMP_TTL, PASS_OVERLAP, CONDENSE_MIN, FONT_VAR).
'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {StampType} from './engine';
import {FONT_VAR, FONT_WEIGHT, WORLDS} from './params';

export default function StampTypeCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<StampType | null>(null);
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

      const next = new StampType(element);
      engine.current = next;
      if (!next.ok) return;
      next.setFont(family);
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
    aria-label="A looping kinetic-type poster. Four lines of type on flat highlight bars fly in from the edges in square hops, hold still to be read, then scatter off. Every moving line leaves chunky blocks of flat colour where it just was. Each pass repeats the same choreography in a new palette with new words, and the two passes overlap so their trails flood the screen as the colour changes."
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: WORLDS[0].bg}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%'}}/>
  </div>;
}
