// Swing type (https://design.how/vault/swing-type), card.tsx.
// FIXED. Change the VARIABLE values in params instead (WORDS, INK, BG, PERIOD, DETENT, CAP_FRAC, WORD_SECONDS, FONT_VAR).
'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {SwingType} from './engine';
import {BG, FONT_VAR, FONT_WEIGHT, FONT_WEIGHT_EDGE} from './params';

export default function SwingTypeCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<SwingType | null>(null);
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

      const next = new SwingType(element, family);
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
      const first = family.split(',')[0].replace(/["']/g, '').trim();
      if (document.fonts?.load) Promise.all([document.fonts.load(`${FONT_WEIGHT} 1em "${first}"`), document.fonts.load(`${FONT_WEIGHT_EDGE} 1em "${first}"`)]).then(() => { if (!cancelled) engine.current?.refreshFont(); }, () => {});
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
    aria-label="Large coloured letters swing slowly back and forth across a white field. Each letter turns edge-on as it travels, thinning to a coloured sliver at the sides and opening to full width in the middle, so only two or three letters can be read at any moment and the whole word never appears at once. Every few seconds the letters turn over, one after another, into a different word."
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: BG}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%'}}/>
  </div>;
}
