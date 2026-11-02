// Eclipse grid (https://design.how/vault/eclipse-grid), card.tsx.
// FIXED. Change the VARIABLE values in params instead (GROUND, INK, PHASE, SEPARATION, RING_SHARE, LIGHT).
'use client';

import {useEffect, useRef, type PointerEvent} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {EclipseGrid} from './engine';
import {GROUND, SCENE_H, SCENE_W} from './params';

export default function EclipseGridCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<EclipseGrid | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  const onPointer = (event: PointerEvent<HTMLDivElement>) => {
    const r = event.currentTarget.getBoundingClientRect();
    if (r.width && r.height) engine.current?.setLight(((event.clientX - r.left) / r.width) * SCENE_W, ((event.clientY - r.top) / r.height) * SCENE_H);
  };
  const onLeave = () => engine.current?.clearLight();

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const raf = requestAnimationFrame(() => {
      const next = new EclipseGrid(element);
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
    });

    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => engine.current?.resize(), 120); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label="A grid of eighty thin amber circles on a near-black field, ten across and eight down. One by one, on their own rhythms, circles slide up and to the left and uncover a solid amber disc behind them as a thick crescent to the lower right, then slide back and cover it again. About half are open at any moment, in no visible order. Moving the pointer over the field tilts the crescents away from it, like shadows from a lamp, and eases the nearest circles partway open."
    onPointerMove={onPointer}
    onPointerDown={onPointer}
    onPointerLeave={onLeave}
    onPointerCancel={onLeave}
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: GROUND, touchAction: 'pan-y', userSelect: 'none'}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%'}}/>
  </div>;
}
