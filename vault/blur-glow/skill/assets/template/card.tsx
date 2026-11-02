// Blur glow (https://design.how/vault/blur-glow), card.tsx.
// FIXED. Change the VARIABLE values in params instead (WORDS, PALETTES, HOLD_MS, HOLD_SCALE, MORPH_SEC, LETTER_SPREAD, GRAIN, WARP_AMP, WARP_RADIUS).
'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {BlurGlow} from './engine';
import {PALETTES, WORDS} from './params';

const FONT_VAR = '--visual-rounded';
const [r, g, b] = PALETTES[0].paper.map(c => Math.round(c * 255));

export default function BlurGlowCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const engine = useRef<BlurGlow | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      const next = new BlurGlow(host);
      engine.current = next;
      if (prefersReducedMotion()) next.renderStill(true);
      else if (running.current) next.start();
      const probe = document.createElement('span');
      probe.style.cssText = `position:absolute;visibility:hidden;font-family:var(${FONT_VAR})`;
      probe.textContent = 'Ag';
      document.body.appendChild(probe);
      const family = getComputedStyle(probe).fontFamily.split(',')[0].replace(/["']/g, '').trim();
      probe.remove();
      document.fonts?.load?.(`600 1em "${family}"`).then(() => { if (!cancelled) engine.current?.refreshFont(); }, () => {});
    });

    let timer = 0;
    const ro = new ResizeObserver(() => { window.clearTimeout(timer); timer = window.setTimeout(() => engine.current?.onResize(), 120); });
    ro.observe(host);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      ro.disconnect();
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label={`A crisp rounded word in a soft coloured glow on light paper, cycling through the words ${WORDS.join(', ')}, each in a new colour world.`}
    className={className}
    style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: `rgb(${r}, ${g}, ${b})`}}
  />;
}
