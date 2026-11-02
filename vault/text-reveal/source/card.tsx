'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {TextReveal} from './engine';
import {BG, FONT_CSS, FONT_WEIGHT, GRAIN_SVG, WHITE_WASH} from './params';

export default function TextRevealCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const wash = useRef<HTMLDivElement>(null);
  const engine = useRef<TextReveal | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()), {threshold: 0.15});

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      const next = new TextReveal(host, wash.current);
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
      const probe = document.createElement('span');
      probe.style.cssText = `position:absolute;visibility:hidden;font-family:${FONT_CSS}`;
      probe.textContent = 'Ag';
      document.body.appendChild(probe);
      const family = getComputedStyle(probe).fontFamily.split(',')[0].replace(/["']/g, '').trim();
      probe.remove();
      document.fonts?.load?.(`${FONT_WEIGHT} 1em "${family}"`).then(() => { if (!cancelled) engine.current?.refreshFont(); }, () => {});
    });

    let timer = 0;
    const ro = new ResizeObserver(() => { window.clearTimeout(timer); timer = window.setTimeout(() => engine.current?.resize(), 120); });
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
    aria-label="Two small text blocks in opposite corners that materialise through a soft cloudy mask, then clear and repeat with new words."
    className={className}
    style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: BG}}
  >
    <div ref={wash} style={{position: 'absolute', inset: '-8%', pointerEvents: 'none', backgroundImage: WHITE_WASH, transform: 'translate(-0.8%, -0.6%) scale(1.08)'}}/>
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: `url("${GRAIN_SVG}")`, backgroundSize: '140px 140px', opacity: 0.05, mixBlendMode: 'multiply'}}/>
  </div>;
}
