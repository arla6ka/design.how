// Spray burst (https://design.how/vault/spray-burst), card.tsx.
// FIXED. Change the VARIABLE values in params instead (PALETTES, ORDER, SCENE_MS, FPS, SPRAY_INK, SPRAY_PLATE, SPRAY_SCALE, GRAIN_SCALE, CURSOR_AMOUNT, CURSOR_SPRAY, CURSOR_GRAIN).
'use client';

import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {SprayBurst} from './engine';
import {CARD_BG} from './params';

export default function SprayBurstCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<SprayBurst | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const raf = requestAnimationFrame(() => {
      const next = new SprayBurst(element);
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
    });

    const onMove = (event: PointerEvent) => {
      const r = element.getBoundingClientRect();
      engine.current?.setPointer(event.clientX - r.left, event.clientY - r.top);
    };
    const onLeave = () => engine.current?.setPointer(null, null);
    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerdown', onMove);
    for (const type of ['pointerleave', 'pointercancel'] as const) element.addEventListener(type, onLeave);

    let timer = 0;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        engine.current?.resize();
        if (!running.current) engine.current?.renderStill();
      }, 120);
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerdown', onMove);
      for (const type of ['pointerleave', 'pointercancel'] as const) element.removeEventListener(type, onLeave);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label="A screenprint on cream paper that changes every three seconds, each time in new colours: rings each broken by a turning gap, a pinwheel of wedges, a many-pointed starburst jumping around its plate, a field of dots swelling under a passing wave, thick bars sliding across each other, and a crowd of circles drifting together into blobs. Every edge is a fine spray of dots rather than a clean line, and the whole print shivers as if redrawn by hand on every frame. Moving the pointer across it lays the ink on more heavily under your hand."
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: `rgb(${CARD_BG[0]}, ${CARD_BG[1]}, ${CARD_BG[2]})`}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%', touchAction: 'pan-y'}}/>
  </div>;
}
