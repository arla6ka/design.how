// Pop type (https://design.how/vault/pop-type), card.tsx.
// FIXED. Change the VARIABLE values in params instead (PALETTE, GROUND, WORD, CONTACT_MS, SQUASH, SWELL_PEAK, FONT_VAR).
'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {PopType} from './engine';
import {FONT_VAR, FONT_WEIGHT, GROUND} from './params';

export default function PopTypeCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<PopType | null>(null);
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

      const next = new PopType(element, family);
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
      const first = family.split(',')[0].replace(/["']/g, '').trim();
      document.fonts?.load(`${FONT_WEIGHT} 1em "${first}"`).then(() => { if (!cancelled) engine.current?.refreshFont(); }, () => {});
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
    aria-label="The word Motion in chunky letters with a hard drop shadow in a second colour on a white field, set so tight each letter overlaps the next, shown at a stepped ten frames a second like a flipbook. The letters fall in one by one, stretching as they drop and squashing as they land, their shadows a beat behind. The word then swells as if inflating, slowly and then quickly, and pops into a ring of small dashes in the next colour that flies outward and is gone. After a beat of empty field the letters fall again in a new pair of colours."
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: GROUND}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%'}}/>
  </div>;
}
