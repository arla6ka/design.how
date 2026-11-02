// Pixel threshold (https://design.how/vault/pixel-threshold), card.tsx.
// FIXED. Change the VARIABLE values in params instead (SEQUENCE, COLORWAYS, DEFAULTS.threshold, FINE, COARSE, HOLD_MS, COLLAPSE_MS, RESOLVE_MS, DEFAULTS.halo, DEFAULTS.keyline, DEFAULTS.keylineOffset, DEFAULTS.texture, FONT_CSS, FONT_WEIGHT).
'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {PixelThreshold} from './engine';
import {COLORWAYS, FONT_CSS, FONT_WEIGHT} from './params';

const [r, g, b] = COLORWAYS[0].ground.map(c => Math.round(c * 255));

export default function PixelThresholdCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const engine = useRef<PixelThreshold | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    let cancelled = false;
    let built = false;
    let timer = 0;
    const build = (family?: string) => {
      window.clearTimeout(timer);
      if (cancelled || built) return;
      built = true;
      const next = new PixelThreshold(host, family ? `"${family}", sans-serif` : undefined);
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) next.renderStill();
      else {
        next.setCycling(true);
        if (running.current) next.start();
      }
    };
    const raf = requestAnimationFrame(() => {
      const probe = document.createElement('span');
      probe.style.cssText = `position:absolute;visibility:hidden;font-family:${FONT_CSS}`;
      probe.textContent = 'Ag';
      document.body.appendChild(probe);
      const family = getComputedStyle(probe).fontFamily.split(',')[0].replace(/["']/g, '').trim();
      probe.remove();
      if (!family || !document.fonts?.load) return build();
      timer = window.setTimeout(() => build(family), 350);
      document.fonts.load(`${FONT_WEIGHT} 1em "${family}"`).then(() => build(family), () => build(family));
    });

    let resizeTimer = 0;
    const onResize = () => { window.clearTimeout(resizeTimer); resizeTimer = window.setTimeout(() => engine.current?.resize(), 120); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label="A short word printed into a flat colour poster, its edges quantised into hard pixel blocks by a threshold. Every few seconds the grid collapses into big squares and a new word and colourway resolve out of them; the drop shadow swings away from the pointer."
    className={className}
    style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: `rgb(${r}, ${g}, ${b})`, touchAction: 'pan-y'}}
  />;
}
