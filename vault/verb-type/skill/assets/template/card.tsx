// Verb type (https://design.how/vault/verb-type), card.tsx.
// FIXED. Change the VARIABLE values in params instead (PHASES, MOTTLE_DEPTH, SPLIT_PX, SPLIT_HUE, SMEAR_ALPHA, FONT_VAR).
'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {VerbType} from './engine';
import {FONT_VAR, FONT_WEIGHT, PHASES} from './params';

export default function VerbTypeCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<VerbType | null>(null);
  const held = useRef(false);
  const running = usePause(box, run => (run && !held.current ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const element = canvas.current;
    const host = box.current;
    if (!element || !host) return;
    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      const probe = document.createElement('span');
      probe.style.cssText = `position:absolute;visibility:hidden;font-family:var(${FONT_VAR})`;
      probe.textContent = 'Ag';
      document.body.appendChild(probe);
      const family = getComputedStyle(probe).fontFamily || 'sans-serif';
      probe.remove();

      const next = new VerbType(element, family);
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current && !held.current) next.start();
      const first = family.split(',')[0].replace(/["']/g, '').trim();
      document.fonts?.load(`${FONT_WEIGHT} 1em "${first}"`).then(() => { if (!cancelled) engine.current?.refreshFont(); }, () => {});
    });

    const grab = () => { held.current = true; engine.current?.stop(); };
    const release = () => {
      if (!held.current) return;
      held.current = false;
      if (running.current) engine.current?.start();
    };
    host.addEventListener('pointerdown', grab);
    host.addEventListener('pointerup', release);
    host.addEventListener('pointercancel', release);
    host.addEventListener('pointerleave', release);

    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => engine.current?.resize(), 120); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      host.removeEventListener('pointerdown', grab);
      host.removeEventListener('pointerup', release);
      host.removeEventListener('pointercancel', release);
      host.removeEventListener('pointerleave', release);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label="Five words appear one after another in a plain grotesque, each acting out its own meaning in its own colour. MOVE's bone letters hop around a cobalt field and slot into place. SKEW's vermilion letters lean over one by one on cream. ROTATE wheels the whole word around the middle of a forest-green frame while its O and second T trade places. BREAK drops its last three black letters onto the floor of a yellow field, where they bounce. CONDENSE squeezes coral letters on aubergine thinner and thinner until they are a hairline. Pressing the picture holds the frame."
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: PHASES[0].ground, userSelect: 'none'}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%'}}/>
  </div>;
}
