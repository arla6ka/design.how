'use client';

import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {RippleGrid} from './engine';
import {PAPER} from './params';

export default function RippleGridCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<RippleGrid | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const raf = requestAnimationFrame(() => {
      const next = new RippleGrid(element);
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
    });

    const onMove = (event: PointerEvent) => {
      const r = element.getBoundingClientRect();
      if (r.width && r.height) engine.current?.setPointer((event.clientX - r.left) / r.width, (event.clientY - r.top) / r.height);
    };
    const onLeave = () => engine.current?.clearPointer();
    element.addEventListener('pointermove', onMove);
    for (const type of ['pointerleave', 'pointercancel', 'pointerup'] as const) element.addEventListener(type, onLeave);

    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => engine.current?.resize(), 120); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      element.removeEventListener('pointermove', onMove);
      for (const type of ['pointerleave', 'pointercancel', 'pointerup'] as const) element.removeEventListener(type, onLeave);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label="A grid of soft black blobs on a pale field, seven across and three down at rest. It swells open, its rows bend into rings and then a slow spiral that leans off centre, before folding back into the plain grid."
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: PAPER}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%', touchAction: 'pan-y'}}/>
  </div>;
}
