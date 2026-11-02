// Realistic emboss (https://design.how/vault/emboss), card.tsx.
// FIXED. Change the VARIABLE values in params instead (STYLES, REST_ANGLE, GRUNGE_AMT, BUILTIN_SVGS).
'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {Emboss, FONT_VAR} from './engine';

export function pressFamily(): string {
  const probe = document.createElement('span');
  probe.style.cssText = `position:absolute;visibility:hidden;font-family:var(${FONT_VAR})`;
  probe.textContent = 'Ag';
  document.body.appendChild(probe);
  const family = getComputedStyle(probe).fontFamily || 'sans-serif';
  probe.remove();
  return family;
}

export function whenFace(build: (family: string) => void): () => void {
  let cancelled = false;
  const family = pressFamily();
  const run = () => { if (!cancelled) build(family); };
  const first = family.split(',')[0].replace(/["']/g, '').trim();
  if (document.fonts?.load) document.fonts.load(`800 1em "${first}"`).then(run, run);
  else run();
  return () => { cancelled = true; };
}

export default function EmbossCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const engine = useRef<Emboss | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    const cancel = whenFace(family => {
      const next = new Emboss(host);
      engine.current = next;
      if (!next.ok) return;
      next.setFont(family);
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
    });
    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => engine.current?.resize(), 120); };
    window.addEventListener('resize', onResize);
    return () => {
      cancel();
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label="Three tinted plaster panels side by side, an off-white one, a yellow one and a violet one, with a word, a flower and a word pressed into them and lit from the upper right."
    className={className}
    style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', touchAction: 'pan-y', backgroundColor: '#ffffff'}}
  />;
}
