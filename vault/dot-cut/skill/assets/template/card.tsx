// Dot cut (https://design.how/vault/dot-cut), card.tsx.
// FIXED. Change the VARIABLE values in params instead (SCENES, PALETTES, DEFAULTS.cols, DEFAULTS.hold, DEFAULTS.morph, DEFAULTS.fill, DEFAULTS.brush, FONT_VAR).
'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {DotCut} from './engine';
import {FONT_VAR, PALETTES} from './scenes';

export default function DotCutCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const engine = useRef<DotCut | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    let cancelled = false;
    const probe = document.createElement('span');
    probe.style.cssText = `position:absolute;visibility:hidden;font-family:var(${FONT_VAR})`;
    probe.textContent = 'Ag';
    document.body.appendChild(probe);
    const family = getComputedStyle(probe).fontFamily || 'sans-serif';
    probe.remove();

    const build = () => {
      if (cancelled) return;
      const next = new DotCut(host, family);
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
    };
    const first = family.split(',')[0].replace(/["']/g, '').trim();
    if (document.fonts?.load) document.fonts.load(`600 1em "${first}"`).then(build, build);
    else build();

    const fine = window.matchMedia('(pointer: fine)').matches;
    const onMove = (event: PointerEvent) => {
      const current = engine.current;
      if (!current || prefersReducedMotion()) return;
      const r = host.getBoundingClientRect();
      current.setPointer(current.toCell(event.clientX - r.left, event.clientY - r.top));
    };
    const onLeave = () => engine.current?.setPointer(null);
    if (fine) {
      host.addEventListener('pointermove', onMove);
      host.addEventListener('pointerleave', onLeave);
    }
    return () => {
      cancelled = true;
      if (fine) {
        host.removeEventListener('pointermove', onMove);
        host.removeEventListener('pointerleave', onLeave);
      }
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label="A dense grid of touching circles with a letter, then rings, columns, a checker, boxes and bars cut out of it as negative space, each handed over by a different sweep."
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: PALETTES[0][1]}}
  />;
}
