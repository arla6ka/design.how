'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {FlyingCursors} from './engine';
import {FrostedWord} from './frosted-word';
import {CURSORS, GROUND, INK, WORD, WORD_FONT} from './params';

export default function CursorsCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const engine = useRef<FlyingCursors | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()), {threshold: 0.15});

  useEffect(() => {
    const host = box.current;
    const layer = stage.current;
    if (!host || !layer) return;
    const raf = requestAnimationFrame(() => {
      const next = new FlyingCursors(host, layer, CURSORS);
      engine.current = next;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
    });
    return () => {
      cancelAnimationFrame(raf);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label={`The word ${WORD} in frosted glass, with three labelled collaborator cursors flying around it.`}
    className={className}
    style={{position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', overflow: 'hidden', userSelect: 'none', background: GROUND, containerType: 'size'}}
  >
    <FrostedWord ground={GROUND} ink={INK} style={{zIndex: 0, fontFamily: WORD_FONT, fontSize: 'clamp(32px, 11cqw, 200px)', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.02em'}}>{WORD}</FrostedWord>
    <div ref={stage} aria-hidden style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}/>
  </div>;
}
