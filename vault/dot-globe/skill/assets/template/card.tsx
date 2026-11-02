// Dot globe (https://design.how/vault/dot-globe), card.tsx.
// FIXED. Change the VARIABLE values in params instead (DUOS, GROUND, EXPS, WOBBLE, HOLD_S, SWAP_S, HANDOFF, TURN_EVERY_S, GAP, ROUND).
'use client';

import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {createDotGlobe, type DotGlobeEngine} from './engine';
import {GROUND} from './params';

export default function DotGlobeCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<DotGlobeEngine | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const host = box.current;
    const element = canvas.current;
    if (!host || !element) return;
    const raf = requestAnimationFrame(() => {
      const next = createDotGlobe(host, element);
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
    });

    const fine = window.matchMedia('(pointer: fine)').matches;
    const onMove = (event: PointerEvent) => {
      const r = host.getBoundingClientRect();
      engine.current?.setPointer({x: event.clientX - r.left, y: event.clientY - r.top});
    };
    const onLeave = () => engine.current?.setPointer(null);
    if (fine) {
      host.addEventListener('pointermove', onMove);
      host.addEventListener('pointerleave', onLeave);
    }

    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => engine.current?.resize(), 120); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      if (fine) {
        host.removeEventListener('pointermove', onMove);
        host.removeEventListener('pointerleave', onLeave);
      }
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label="Three rounded-cube forms side by side on one grey ground, coloured lime on aubergine, coral on petrol teal, and acid yellow on cobalt. Each is tiled with rounded squares that crowd together and shrink toward the edges as the surface curves away, rocks gently, and carries a bright symbol painted onto its surface. The marks pass along the row from left to right, and now and then one form turns all the way round and comes back carrying the next mark. Moving the pointer leans the forms toward it and opens the tiles underneath."
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: GROUND, userSelect: 'none'}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%'}}/>
  </div>;
}
