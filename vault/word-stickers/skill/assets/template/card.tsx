// Word stickers (https://design.how/vault/word-stickers), card.tsx.
// FIXED. Change the VARIABLE values in params instead (STICKERS, GRAB_SCALE, THROW_SCALE, FRICTION, BOUNCE, PEEL_ELEVATION).
'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {WordStickers} from './engine';
import {FONT_VAR, STICKERS} from './stickers';

export default function WordStickersCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const engine = useRef<WordStickers | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    let cancelled = false;
    const probe = document.createElement('span');
    probe.style.cssText = `position:absolute;visibility:hidden;font-family:var(${FONT_VAR})`;
    probe.textContent = 'Ag';
    document.body.appendChild(probe);
    const first = (getComputedStyle(probe).fontFamily || 'monospace').split(',')[0].replace(/["']/g, '').trim();
    probe.remove();

    const build = () => {
      if (cancelled) return;
      const next = new WordStickers(host);
      engine.current = next;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
    };
    if (document.fonts?.load) document.fonts.load(`400 1em "${first}"`).then(build, build);
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
    aria-label={`Die-cut word stickers on a light page, each in its own colour pair, that can be grabbed, peeled and thrown: ${STICKERS.map(s => s.word).join(', ')}.`}
    className={className}
    style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', userSelect: 'none', backgroundColor: '#fcfcfc'}}
  />;
}
