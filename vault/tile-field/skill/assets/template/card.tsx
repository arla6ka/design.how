// Tile field (https://design.how/vault/tile-field), card.tsx.
// FIXED. Change the VARIABLE values in params instead (WORD, CELLS_ACROSS, HUE, HUE_SWING, REST, SPEED, FADE_RATE).
'use client';

import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {TileField} from './engine';
import {WORD} from './params';

export default function TileFieldCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<TileField | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const raf = requestAnimationFrame(() => {
      const next = new TileField(element);
      engine.current = next;
      if (!next.ok) return;
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
    aria-label={`The words "${WORD}" drawn as a dense grid of tiny grey tiles. A slow blue wave wanders across them and grows the tiles it passes, and the pointer leaves a fading trail of light.`}
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: 'light-dark(#ffffff, #242423)', userSelect: 'none'}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%', pointerEvents: 'none'}}/>
  </div>;
}
