// Chromatic glow (https://design.how/vault/chroma-glow), card.tsx.
// FIXED. Change the VARIABLE values in params instead (HERO_CYCLE, CHROMA_PRESETS, split, bloom, spectral).
'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {ChromaGlow, FONT_VAR} from './engine';
import {HERO_CYCLE, toHex} from './params';

export function wordFamily(): string {
  const probe = document.createElement('span');
  probe.style.cssText = `position:absolute;visibility:hidden;font-family:var(${FONT_VAR})`;
  probe.textContent = 'Ag';
  document.body.appendChild(probe);
  const family = getComputedStyle(probe).fontFamily || 'sans-serif';
  probe.remove();
  return family;
}

export default function ChromaGlowCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const engine = useRef<ChromaGlow | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    let cancelled = false;
    const family = wordFamily();
    const build = () => {
      if (cancelled) return;
      const next = new ChromaGlow(host, HERO_CYCLE[0].params);
      engine.current = next;
      if (!next.ok) return;
      next.setFont(family);
      if (prefersReducedMotion()) {
        next.setParams({word: HERO_CYCLE[0].word});
        next.renderStill();
        return;
      }
      next.enableCycle(HERO_CYCLE.map(c => c.word), HERO_CYCLE.map(c => c.params));
      if (running.current) next.start();
    };
    const first = family.split(',')[0].replace(/["']/g, '').trim();
    if (document.fonts?.load) document.fonts.load(`800 1em "${first}"`).then(build, build);
    else build();

    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => engine.current?.resize(), 120); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  const bg = HERO_CYCLE[0].params.bg;
  return <div
    ref={box}
    role="img"
    aria-label={`A short word glowing on a coloured wall, its edges split into warm and cool copies that drift apart, cycling through ${HERO_CYCLE.map(c => c.word).join(', ')}.`}
    className={className}
    style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', touchAction: 'pan-y', backgroundColor: bg ? toHex(bg) : '#1c2133'}}
  />;
}
