// Wild type (https://design.how/vault/wild-type), card.tsx.
// FIXED. Change the VARIABLE values in params instead (WORDS, ACCENTS, BG, INK, OBLIQUE, REST_WIDTH_FRAC, GRAIN_ALPHA, FONT_CSS).
'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {WildType} from './engine';
import {BG, FONT_CSS, FONT_WEIGHT} from './params';

export default function WildTypeCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<WildType | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let cancelled = false;
    let fallback = 0;
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden';
    probe.style.fontFamily = FONT_CSS;
    probe.textContent = 'Ag';
    document.body.appendChild(probe);
    const family = getComputedStyle(probe).fontFamily || 'sans-serif';
    probe.remove();

    const build = () => {
      window.clearTimeout(fallback);
      if (cancelled || engine.current) return;
      const next = new WildType(element, family);
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
    };
    const first = family.split(',')[0].replace(/["']/g, '').trim();
    if (document.fonts?.load) {
      fallback = window.setTimeout(build, 350);
      document.fonts.load(`${FONT_WEIGHT} 1em "${first}"`).then(build, build);
    } else build();

    const onMove = (event: PointerEvent) => {
      const r = element.getBoundingClientRect();
      engine.current?.setPointer(event.clientX - r.left, event.clientY - r.top);
    };
    const onLeave = () => engine.current?.setPointer(null, null);
    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerleave', onLeave);
    element.addEventListener('pointercancel', onLeave);

    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => engine.current?.resize(), 120); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerleave', onLeave);
      element.removeEventListener('pointercancel', onLeave);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label="A single design word in heavy white oblique lowercase on black. It types itself in letter by letter, then inflates to fill the card as giant warped letterforms with a coloured ink slipping out from under the white, swings over an arch, shrinks back to rest, and un-types itself letter by letter. Each loop brings the next word in its own colour."
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: BG}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%'}}/>
  </div>;
}
