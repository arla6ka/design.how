'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {BlurReveal, FONT_VAR} from './engine';
import {PANELS} from './panels';

export default function BlurRevealCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const engine = useRef<BlurReveal | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    let cancelled = false;
    const probe = document.createElement('span');
    probe.style.cssText = `position:absolute;visibility:hidden;font-family:var(${FONT_VAR})`;
    probe.textContent = 'Ag';
    document.body.appendChild(probe);
    const first = (getComputedStyle(probe).fontFamily || 'sans-serif').split(',')[0].replace(/["']/g, '').trim();
    probe.remove();

    const build = () => {
      if (cancelled) return;
      const next = new BlurReveal(host);
      engine.current = next;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
    };
    if (document.fonts?.load) document.fonts.load(`500 1em "${first}"`).then(build, build);
    else build();

    return () => {
      cancelled = true;
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label={`Coloured panels in turn, each line dissolving in out of a blur: ${PANELS.map(panel => panel.line).join(', ')}.`}
    className={className}
    style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: PANELS[0].bg}}
  />;
}
